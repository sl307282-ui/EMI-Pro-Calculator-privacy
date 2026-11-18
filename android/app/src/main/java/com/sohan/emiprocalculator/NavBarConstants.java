package com.sohan.emiprocalculator;

import android.graphics.Color;

/**
 * Constants for the navigation bar backing strip colors and animation.
 */
public final class NavBarConstants {
    private NavBarConstants() {}

    // Light Mode: #E8EEF7 (soft blue-grey, dark icons)
    public static final int COLOR_LIGHT = Color.parseColor("#E8EEF7");
    public static final String COLOR_LIGHT_HEX = "#E8EEF7";

    // Dark Mode: #101827 (dark slate, light icons)
    public static final int COLOR_DARK = Color.parseColor("#101827");
    public static final String COLOR_DARK_HEX = "#101827";

    // Duration for the height and alpha transition animation (ms)
    public static final long ANIM_DURATION_MS = 150L;
}
