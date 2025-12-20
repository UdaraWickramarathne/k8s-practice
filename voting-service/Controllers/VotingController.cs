using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using VotingService.Models;

namespace VotingService.Controllers
{
    [ApiController]
    [Route("api/v1/votes")]
    public class VotingController : ControllerBase
    {
        private readonly IConnectionMultiplexer _redis;

        public VotingController(IConnectionMultiplexer redis)
        {
            _redis = redis;
        }

        // POST /api/v1/votes
        [HttpPost]
        public async Task<ActionResult<Vote>> Vote([FromBody] VoteRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Choice))
                return BadRequest(new { error = "Choice is required ('cat' or 'dog')." });

            var choice = request.Choice.Trim().ToLowerInvariant();
            if (choice != "cat" && choice != "dog")
                return BadRequest(new { error = "Choice must be 'cat' or 'dog'." });

            var db = _redis.GetDatabase();

            // generate an auto-increment id
            var id = (long)await db.StringIncrementAsync("votes:next").ConfigureAwait(false);

            var vote = new Vote
            {
                Id = (int)id,
                Choice = choice,
                CreatedAt = DateTime.UtcNow
            };

            var key = $"vote:{id}";

            // store vote as a hash
            var entries = new HashEntry[]
            {
                new HashEntry("Id", vote.Id),
                new HashEntry("Choice", vote.Choice),
                new HashEntry("CreatedAt", vote.CreatedAt.ToString("o"))
            };

            await db.HashSetAsync(key, entries).ConfigureAwait(false);

            // record ID so we can list all votes later
            await db.ListRightPushAsync("votes:ids", id).ConfigureAwait(false);

            // increment aggregate counter for the choice
            await db.StringIncrementAsync($"votes:count:{choice}").ConfigureAwait(false);

            // optional: set a TTL on individual vote entries if desired

            return Created($"/api/v1/votes/{vote.Id}", vote);
        }

        // GET /api/v1/votes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vote>>> GetAll()
        {
            var db = _redis.GetDatabase();
            var idValues = await db.ListRangeAsync("votes:ids").ConfigureAwait(false);
            var results = new List<Vote>();

            foreach (var idVal in idValues)
            {
                if (idVal.IsNullOrEmpty) continue;

                var key = $"vote:{idVal}";
                var idRv = await db.HashGetAsync(key, "Id").ConfigureAwait(false);
                if (idRv.IsNullOrEmpty) continue;

                if (!int.TryParse(idRv.ToString(), out var id)) continue;

                var choiceRv = await db.HashGetAsync(key, "Choice").ConfigureAwait(false);
                var createdAtRv = await db.HashGetAsync(key, "CreatedAt").ConfigureAwait(false);

                DateTime createdAt = DateTime.UtcNow;
                if (!createdAtRv.IsNullOrEmpty)
                {
                    DateTime.TryParse(createdAtRv.ToString(), null, System.Globalization.DateTimeStyles.RoundtripKind, out createdAt);
                }

                results.Add(new Vote
                {
                    Id = id,
                    Choice = choiceRv.ToString(),
                    CreatedAt = createdAt
                });
            }

            return Ok(results);
        }

        // GET /api/v1/votes/counts
        [HttpGet("counts")]
        public async Task<ActionResult<object>> GetCounts()
        {
            var db = _redis.GetDatabase();

            long catCount = 0;
            long dogCount = 0;

            var catRv = await db.StringGetAsync("votes:count:cat").ConfigureAwait(false);
            if (!catRv.IsNullOrEmpty)
                long.TryParse(catRv.ToString(), out catCount);

            var dogRv = await db.StringGetAsync("votes:count:dog").ConfigureAwait(false);
            if (!dogRv.IsNullOrEmpty)
                long.TryParse(dogRv.ToString(), out dogCount);

            return Ok(new { cat = catCount, dog = dogCount });
        }
    }
}
