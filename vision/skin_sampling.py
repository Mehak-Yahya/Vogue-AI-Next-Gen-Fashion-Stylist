import numpy as np


def estimate_skin_rgb(image_rgb, skin_mask):
    """Estimate facial skin color from the central, well-lit part of a mask."""
    skin_coordinates = np.argwhere(skin_mask)
    if len(skin_coordinates) < 25:
        raise ValueError("Image does not contain enough detected face skin pixels for analysis.")

    y_min, x_min = skin_coordinates.min(axis=0)
    y_max, x_max = skin_coordinates.max(axis=0) + 1
    region_height = y_max - y_min
    region_width = x_max - x_min
    central_mask = np.zeros_like(skin_mask, dtype=bool)
    central_mask[
        y_min + int(region_height * 0.15):y_min + int(region_height * 0.75),
        x_min + int(region_width * 0.2):x_min + int(region_width * 0.8),
    ] = True

    pixels = image_rgb[skin_mask & central_mask]
    if len(pixels) < 25:
        pixels = image_rgb[skin_mask]

    brightness = np.mean(pixels, axis=1)
    usable = pixels[(brightness > 30) & (brightness < 235)]
    if len(usable) < 25:
        raise ValueError("Image does not contain enough well-lit face skin pixels for analysis.")

    brightness = np.mean(usable, axis=1)
    lower, upper = np.quantile(brightness, [0.1, 0.9])
    trimmed = usable[(brightness >= lower) & (brightness <= upper)]
    return np.median(trimmed, axis=0)