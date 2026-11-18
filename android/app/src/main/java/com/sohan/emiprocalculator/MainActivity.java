package com.sohan.emiprocalculator;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.view.animation.LinearInterpolator;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WindowInsetsCompat lastWindowInsetsCompat = null;
    private Insets lastInsets = null;
    private Insets lastNavInsets = null;
    private boolean isDarkMode = false;
    private boolean isHomeReady = false;
    private NavBarBackingStrip navBarBackingStrip = null;

    public class ThemeBridge {
        @JavascriptInterface
        public void setDarkMode(boolean isDark) {
            try {
                getSharedPreferences("AppPreferences", Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean("is_dark_mode", isDark)
                    .apply();
            } catch (Exception ignored) {}
            runOnUiThread(() -> configureSystemBars(isDark));
        }

        @JavascriptInterface
        public void notifyHomeReady() {
            runOnUiThread(() -> {
                isHomeReady = true;
            });
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> !isHomeReady);
        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            final ObjectAnimator fadeAnimator = ObjectAnimator.ofFloat(splashScreenView.getView(), View.ALPHA, 1f, 0f);
            fadeAnimator.setInterpolator(new LinearInterpolator());
            fadeAnimator.setDuration(280);
            fadeAnimator.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    splashScreenView.remove();
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        getSplashScreen().clearOnExitAnimationListener();
                    }
                }
            });
            fadeAnimator.start();
        });

        // Safety timeout so splash can never get stuck under any circumstance
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            isHomeReady = true;
        }, 3000);

        // Read saved theme preference and enable edge-to-edge
        isDarkMode = readSavedThemePreference();
        updateEdgeToEdge(isDarkMode);

        super.onCreate(savedInstanceState);

        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);

        int bgColor = isDarkMode ? Color.parseColor("#0F172A") : Color.parseColor("#F8FAFC");
        window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(bgColor));

        // Disable contrast enforcement on API 29-34 so system doesn't draw default scrim
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && Build.VERSION.SDK_INT < 35) {
            window.setNavigationBarContrastEnforced(false);
        }

        // Locate or dynamically attach the reusable NavBarBackingStrip in root layout
        navBarBackingStrip = findViewById(R.id.navBarBackingStrip);
        if (navBarBackingStrip == null) {
            View webview = findViewById(R.id.webview);
            if (webview != null && webview.getParent() instanceof ViewGroup) {
                ViewGroup root = (ViewGroup) webview.getParent();
                navBarBackingStrip = new NavBarBackingStrip(this);
                navBarBackingStrip.setId(R.id.navBarBackingStrip);
                CoordinatorLayout.LayoutParams lp = new CoordinatorLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, 0
                );
                lp.gravity = Gravity.BOTTOM;
                root.addView(navBarBackingStrip, lp);
            }
        }
        if (navBarBackingStrip != null) {
            navBarBackingStrip.setDarkMode(isDarkMode);
        }

        // Register JavascriptInterface for dynamic theme sync from React SettingsContext
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(bgColor);
            webView.addJavascriptInterface(new ThemeBridge(), "AndroidThemeBridge");
        }

        View decorView = window.getDecorView();

        // Forward WindowInsets to NavBarBackingStrip and WebView
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            lastWindowInsetsCompat = windowInsets;
            lastInsets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            lastNavInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());

            if (navBarBackingStrip != null) {
                navBarBackingStrip.applyWindowInsets(windowInsets);
            }

            applyCssInsets();
            v.post(this::applyCssInsets);

            WebView view = getBridge() != null ? getBridge().getWebView() : null;
            if (view != null) {
                ViewCompat.dispatchApplyWindowInsets(view, windowInsets);
            }
            return windowInsets;
        });

        // Delay injection after webview initialization
        decorView.postDelayed(this::applyCssInsets, 300);
        decorView.postDelayed(this::applyCssInsets, 800);
        decorView.postDelayed(this::applyCssInsets, 1500);
    }

    private boolean readSavedThemePreference() {
        try {
            SharedPreferences prefs = getSharedPreferences("AppPreferences", Context.MODE_PRIVATE);
            if (prefs.contains("is_dark_mode")) {
                return prefs.getBoolean("is_dark_mode", false);
            }

            SharedPreferences capPrefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            if (capPrefs.contains("app_theme")) {
                String theme = capPrefs.getString("app_theme", "light");
                return "dark".equalsIgnoreCase(theme);
            }
        } catch (Exception ignored) {}

        // Fall back to system configuration or default to Light Mode
        int nightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return nightMode == Configuration.UI_MODE_NIGHT_YES;
    }

    public void configureSystemBars(boolean isDark) {
        this.isDarkMode = isDark;
        updateEdgeToEdge(isDark);

        if (navBarBackingStrip != null) {
            navBarBackingStrip.setDarkMode(isDark);
        }

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            webView.setBackgroundColor(isDark ? Color.parseColor("#0F172A") : Color.parseColor("#F8FAFC"));
        }
    }

    private void updateEdgeToEdge(boolean isDark) {
        SystemBarStyle statusBarStyle = isDark
            ? SystemBarStyle.dark(Color.TRANSPARENT)
            : SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT);

        SystemBarStyle navBarStyle = isDark
            ? SystemBarStyle.dark(Color.TRANSPARENT)
            : SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT);

        EdgeToEdge.enable(this, statusBarStyle, navBarStyle);

        Window window = getWindow();
        if (window != null) {
            WindowCompat.setDecorFitsSystemWindows(window, false);

            View decorView = window.getDecorView();
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
            if (controller != null) {
                controller.setAppearanceLightStatusBars(!isDark);
                controller.setAppearanceLightNavigationBars(!isDark);
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && Build.VERSION.SDK_INT < 35) {
                window.setNavigationBarContrastEnforced(false);
            }
        }
    }

    public void applySystemBarsTheme(boolean isDark) {
        configureSystemBars(isDark);
    }

    @Override
    public void onResume() {
        super.onResume();
        isDarkMode = readSavedThemePreference();
        configureSystemBars(isDarkMode);
        View decorView = getWindow().getDecorView();
        ViewCompat.requestApplyInsets(decorView);
        applyCssInsets();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Follow system theme changes live while app is open
        int nightMode = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;
        isDarkMode = (nightMode == Configuration.UI_MODE_NIGHT_YES);
        configureSystemBars(isDarkMode);

        View decorView = getWindow().getDecorView();
        ViewCompat.requestApplyInsets(decorView);
        applyCssInsets();
    }

    private void applyCssInsets() {
        if (lastInsets == null) return;
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;

        float density = getResources().getDisplayMetrics().density;
        
        int bottomPx = (lastNavInsets != null) ? lastNavInsets.bottom : (lastInsets != null ? lastInsets.bottom : 0);
        int bottomDp = Math.round(bottomPx / density);
        int topDp = Math.round(lastInsets.top / density);
        int leftDp = Math.round(lastInsets.left / density);
        int rightDp = Math.round(lastInsets.right / density);

        String js = String.format(
            java.util.Locale.US,
            "(function() {" +
            "  function apply() {" +
            "    var root = document.documentElement;" +
            "    if (!root) return;" +
            "    root.style.setProperty('--safe-area-inset-top', '%dpx');" +
            "    root.style.setProperty('--safe-area-inset-bottom', '%dpx');" +
            "    root.style.setProperty('--safe-area-inset-left', '%dpx');" +
            "    root.style.setProperty('--safe-area-inset-right', '%dpx');" +
            "    root.style.setProperty('--safe-top', '%dpx');" +
            "    root.style.setProperty('--safe-bottom', '%dpx');" +
            "    root.style.setProperty('--safe-left', '%dpx');" +
            "    root.style.setProperty('--safe-right', '%dpx');" +
            "    root.setAttribute('data-nav-bottom', '%d');" +
            "    window.dispatchEvent(new CustomEvent('safeInsetsChange', { detail: { bottom: %d, top: %d } }));" +
            "  }" +
            "  if (document.readyState === 'loading') {" +
            "    document.addEventListener('DOMContentLoaded', apply, { once: true });" +
            "  } else {" +
            "    apply();" +
            "  }" +
            "})();",
            topDp, bottomDp, leftDp, rightDp,
            topDp, bottomDp, leftDp, rightDp,
            bottomDp, bottomDp, topDp
        );
        webView.evaluateJavascript(js, null);
    }
}
