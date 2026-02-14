using HolaExpress_BE.DTOs.Maps;
using HolaExpress_BE.Interfaces;
using System.Text.Json;
using System.Globalization;

namespace HolaExpress_BE.Services;

public class MapsService : IMapsService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<MapsService> _logger;
    private readonly HttpClient _httpClient;

    public MapsService(IConfiguration configuration, ILogger<MapsService> logger, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    private string GetGoogleApiKey()
    {
        return _configuration["GoogleMaps:ApiKey"] ?? throw new InvalidOperationException("Google Maps API key not configured");
    }

    public async Task<AutocompleteResponse> AutocompleteAddressAsync(string input)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return new AutocompleteResponse 
                { 
                    Status = "ZERO_RESULTS", 
                    Predictions = new List<PredictionDto>() 
                };
            }

            var apiKey = GetGoogleApiKey();
            var url = $"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={Uri.EscapeDataString(input)}&key={apiKey}&language=vi&components=country:vn";

            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google Places API error: {StatusCode} - {Content}", response.StatusCode, content);
                throw new Exception("Failed to fetch autocomplete suggestions");
            }

            var data = JsonSerializer.Deserialize<AutocompleteResponse>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (data?.Status == "REQUEST_DENIED")
            {
                _logger.LogError("Google API REQUEST_DENIED for autocomplete. Check API key. Response: {Content}", content.Substring(0, Math.Min(300, content.Length)));
                throw new Exception("Google Maps API access denied. Please check API key configuration.");
            }

            return data ?? new AutocompleteResponse { Status = "ERROR", Predictions = new() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in autocomplete");
            throw;
        }
    }

    public async Task<PlaceDetailsResponse> GetPlaceDetailsAsync(string placeId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(placeId))
            {
                throw new ArgumentException("Place ID is required");
            }

            var apiKey = GetGoogleApiKey();
            var url = $"https://maps.googleapis.com/maps/api/place/details/json?place_id={Uri.EscapeDataString(placeId)}&key={apiKey}&language=vi";

            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google Place Details API error: {StatusCode} - {Content}", response.StatusCode, content);
                throw new Exception("Failed to fetch place details");
            }

            var data = JsonSerializer.Deserialize<PlaceDetailsResponse>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            return data ?? new PlaceDetailsResponse { Status = "ERROR" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in place details");
            throw;
        }
    }

    public async Task<GeocodeResponse> GeocodeAddressAsync(string address)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(address))
            {
                throw new ArgumentException("Address is required");
            }

            var apiKey = GetGoogleApiKey();
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={apiKey}&language=vi";

            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google Geocoding API error: {StatusCode} - {Content}", response.StatusCode, content);
                throw new Exception("Failed to geocode address");
            }

            var data = JsonSerializer.Deserialize<GeocodeResponse>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (data?.Status == "REQUEST_DENIED")
            {
                _logger.LogError("Google API REQUEST_DENIED for geocode. Check API key. Response: {Content}", content.Substring(0, Math.Min(300, content.Length)));
                throw new Exception("Google Maps API access denied. Please check API key configuration.");
            }

            return data ?? new GeocodeResponse { Status = "ERROR", Results = new() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in geocode");
            throw;
        }
    }

    public async Task<GeocodeResponse> ReverseGeocodeAsync(double lat, double lng)
    {
        try
        {
            var apiKey = GetGoogleApiKey();
            var url = $"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat.ToString(CultureInfo.InvariantCulture)},{lng.ToString(CultureInfo.InvariantCulture)}&key={apiKey}&language=vi";

            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Reverse geocode response: {Content}", content.Substring(0, Math.Min(500, content.Length)));

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google Reverse Geocoding API error: {StatusCode} - {Content}", response.StatusCode, content);
                throw new Exception("Failed to reverse geocode coordinates");
            }

            var data = JsonSerializer.Deserialize<GeocodeResponse>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (data?.Status == "REQUEST_DENIED")
            {
                _logger.LogError("Google API REQUEST_DENIED. Check API key and enabled APIs. Response: {Content}", content);
                throw new Exception("Google Maps API access denied. Please check API key configuration.");
            }

            return data ?? new GeocodeResponse { Status = "ERROR", Results = new() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in reverse geocode");
            throw;
        }
    }

    public async Task<DirectionsResponse> GetDirectionsAsync(double originLat, double originLng, double destLat, double destLng)
    {
        try
        {
            var apiKey = GetGoogleApiKey();
            var origin = $"{originLat.ToString(CultureInfo.InvariantCulture)},{originLng.ToString(CultureInfo.InvariantCulture)}";
            var destination = $"{destLat.ToString(CultureInfo.InvariantCulture)},{destLng.ToString(CultureInfo.InvariantCulture)}";
            var url = $"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode=driving&key={apiKey}&language=vi";

            _logger.LogInformation("Fetching directions from {Origin} to {Destination}", origin, destination);

            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Google Directions API error: {StatusCode} - {Content}", response.StatusCode, content);
                throw new Exception("Failed to get directions");
            }

            var data = JsonSerializer.Deserialize<DirectionsResponse>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });

            if (data?.Status == "REQUEST_DENIED")
            {
                _logger.LogError("Google API REQUEST_DENIED for directions. Check API key. Response: {Content}", content.Substring(0, Math.Min(300, content.Length)));
                throw new Exception("Google Maps API access denied. Please check API key configuration.");
            }

            return data ?? new DirectionsResponse { Status = "ERROR", Routes = new() };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in get directions");
            throw;
        }
    }
}
