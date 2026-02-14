using HolaExpress_BE.DTOs.Maps;

namespace HolaExpress_BE.Interfaces;

public interface IMapsService
{
    Task<AutocompleteResponse> AutocompleteAddressAsync(string input);
    Task<PlaceDetailsResponse> GetPlaceDetailsAsync(string placeId);
    Task<GeocodeResponse> GeocodeAddressAsync(string address);
    Task<GeocodeResponse> ReverseGeocodeAsync(double lat, double lng);
    Task<DirectionsResponse> GetDirectionsAsync(double originLat, double originLng, double destLat, double destLng);
}
