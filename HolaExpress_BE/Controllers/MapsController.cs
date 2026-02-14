using Microsoft.AspNetCore.Mvc;
using HolaExpress_BE.Interfaces;

namespace HolaExpress_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MapsController : ControllerBase
{
    private readonly IMapsService _mapsService;
    private readonly ILogger<MapsController> _logger;

    public MapsController(IMapsService mapsService, ILogger<MapsController> logger)
    {
        _mapsService = mapsService;
        _logger = logger;
    }

    // GET: api/Maps/autocomplete?input=hanoi
    [HttpGet("autocomplete")]
    public async Task<ActionResult> AutocompleteAddress([FromQuery] string input)
    {
        try
        {
            var result = await _mapsService.AutocompleteAddressAsync(input);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in autocomplete");
            return StatusCode(500, new { status = "ERROR", message = "Internal server error" });
        }
    }

    // GET: api/Maps/place-details?placeId=xxx
    [HttpGet("place-details")]
    public async Task<ActionResult> GetPlaceDetails([FromQuery] string placeId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(placeId))
            {
                return BadRequest(new { status = "INVALID_REQUEST", message = "Place ID is required" });
            }

            var result = await _mapsService.GetPlaceDetailsAsync(placeId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in place details");
            return StatusCode(500, new { status = "ERROR", message = "Internal server error" });
        }
    }

    // GET: api/Maps/geocode?address=hanoi
    [HttpGet("geocode")]
    public async Task<ActionResult> GeocodeAddress([FromQuery] string address)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(address))
            {
                return BadRequest(new { status = "INVALID_REQUEST", message = "Address is required" });
            }

            var result = await _mapsService.GeocodeAddressAsync(address);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in geocode");
            return StatusCode(500, new { status = "ERROR", message = "Internal server error" });
        }
    }

    // GET: api/Maps/reverse-geocode?lat=21.028511&lng=105.804817
    [HttpGet("reverse-geocode")]
    public async Task<ActionResult> ReverseGeocode([FromQuery] double lat, [FromQuery] double lng)
    {
        try
        {
            var result = await _mapsService.ReverseGeocodeAsync(lat, lng);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in reverse geocode");
            return StatusCode(500, new { status = "ERROR", message = "Internal server error" });
        }
    }

    // GET: api/Maps/directions?originLat=21.028511&originLng=105.804817&destLat=21.028511&destLng=105.804817
    [HttpGet("directions")]
    public async Task<ActionResult> GetDirections(
        [FromQuery] double originLat, 
        [FromQuery] double originLng, 
        [FromQuery] double destLat, 
        [FromQuery] double destLng)
    {
        try
        {
            var result = await _mapsService.GetDirectionsAsync(originLat, originLng, destLat, destLng);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in get directions");
            return StatusCode(500, new { status = "ERROR", message = "Internal server error" });
        }
    }
}
