import requests

def get_data(latitude, longitude, width, height):
    # Calculate bounding box coordinates
    min_lat = latitude
    max_lat = latitude + (height / 69)  # 1 degree of latitude is approximately 69 miles
    min_lon = longitude
    max_lon = longitude + (width / (69 * abs(latitude)))  # Adjust for longitude scale

    # Construct Overpass QL query
    query = f"""
    [out:json];
    (
      way["highway"](bbox:{min_lat},{min_lon},{max_lat},{max_lon});
    );
    out body;
    """

    # Send HTTP request to Overpass API
    response = requests.post("https://overpass-api.de/api/interpreter", data=query)

    # Parse response
    data = response.json()
    return data

# Example usage
latitude = 34.0632405
longitude = -118.4470467
width = 1  # in miles
height = 1  # in miles

data = get_data(latitude, longitude, width, height)
print(data)  # Process this data according to your needs
