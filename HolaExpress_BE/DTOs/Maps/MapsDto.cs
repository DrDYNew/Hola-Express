using System.Text.Json.Serialization;

namespace HolaExpress_BE.DTOs.Maps;

public class AutocompleteResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("predictions")]
    public List<PredictionDto> Predictions { get; set; } = new();
}

public class PredictionDto
{
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
    
    [JsonPropertyName("place_id")]
    public string PlaceId { get; set; } = string.Empty;
    
    [JsonPropertyName("structured_formatting")]
    public StructuredFormatting? StructuredFormatting { get; set; }
}

public class StructuredFormatting
{
    [JsonPropertyName("main_text")]
    public string MainText { get; set; } = string.Empty;
    
    [JsonPropertyName("secondary_text")]
    public string SecondaryText { get; set; } = string.Empty;
}

public class PlaceDetailsResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("result")]
    public PlaceResult? Result { get; set; }
}

public class PlaceResult
{
    [JsonPropertyName("formatted_address")]
    public string FormattedAddress { get; set; } = string.Empty;
    
    [JsonPropertyName("geometry")]
    public Geometry? Geometry { get; set; }
}

public class Geometry
{
    [JsonPropertyName("location")]
    public Location? Location { get; set; }
}

public class Location
{
    [JsonPropertyName("lat")]
    public double Lat { get; set; }
    
    [JsonPropertyName("lng")]
    public double Lng { get; set; }
}

public class GeocodeResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("results")]
    public List<GeocodeResult> Results { get; set; } = new();
}

public class GeocodeResult
{
    [JsonPropertyName("formatted_address")]
    public string FormattedAddress { get; set; } = string.Empty;
    
    [JsonPropertyName("geometry")]
    public Geometry? Geometry { get; set; }
}

public class DirectionsResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
    
    [JsonPropertyName("routes")]
    public List<Route> Routes { get; set; } = new();
}

public class Route
{
    [JsonPropertyName("overview_polyline")]
    public OverviewPolyline? OverviewPolyline { get; set; }
    
    [JsonPropertyName("legs")]
    public List<Leg> Legs { get; set; } = new();
}

public class OverviewPolyline
{
    [JsonPropertyName("points")]
    public string Points { get; set; } = string.Empty;
}

public class Leg
{
    [JsonPropertyName("distance")]
    public Distance? Distance { get; set; }
    
    [JsonPropertyName("duration")]
    public Duration? Duration { get; set; }
}

public class Distance
{
    [JsonPropertyName("value")]
    public int Value { get; set; }
    
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class Duration
{
    [JsonPropertyName("value")]
    public int Value { get; set; }
    
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}
