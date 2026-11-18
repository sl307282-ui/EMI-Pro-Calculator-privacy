package com.sohan.emiprocalculator;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ValueAnimator;
import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;
import java.util.List;

/**
 * Reusable custom View that sits behind the Android system navigation bar.
 * Drive its height strictly from live window insets (WindowInsetsCompat.Type.navigationBars()).
 * Disappears with 0 height and no leftover background when the navigation bar is hidden.
 * Animates back in over 150ms when the navigation bar returns.
 */
public class NavBarBackingStrip extends View {
    private boolean isDarkMode = false;
    private int currentTargetHeight = -1;
    private ValueAnimator heightAnimator = null;
    private boolean isWindowInsetsAnimationRunning = false;

    public NavBarBackingStrip(Context context) {
        super(context);
        init(context, null);
    }

    public NavBarBackingStrip(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init(context, attrs);
    }

    public NavBarBackingStrip(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context, attrs);
    }

    private void init(Context context, @Nullable AttributeSet attrs) {
        setClickable(false);
        setFocusable(false);

        // Detect initial system theme
        int nightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        isDarkMode = (nightMode == Configuration.UI_MODE_NIGHT_YES);
        updateBackgroundColor();

        // Start hidden until valid insets arrive
        setVisibility(View.GONE);
        setExactHeight(0);

        // Setup WindowInsetsAnimationCompat callback to track live system inset animations
        ViewCompat.setWindowInsetsAnimationCallback(this, new WindowInsetsAnimationCompat.Callback(
                WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_STOP
        ) {
            @Override
            public void onPrepare(@NonNull WindowInsetsAnimationCompat animation) {
                if ((animation.getTypeMask() & WindowInsetsCompat.Type.navigationBars()) != 0) {
                    isWindowInsetsAnimationRunning = true;
                    if (heightAnimator != null && heightAnimator.isRunning()) {
                        heightAnimator.cancel();
                    }
                }
            }

            @NonNull
            @Override
            public WindowInsetsCompat onProgress(
                    @NonNull WindowInsetsCompat insets,
                    @NonNull List<WindowInsetsAnimationCompat> runningAnimations
            ) {
                Insets navInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
                setExactHeight(navInsets.bottom);
                setAlpha(navInsets.bottom > 0 ? 1.0f : 0.0f);
                return insets;
            }

            @Override
            public void onEnd(@NonNull WindowInsetsAnimationCompat animation) {
                if ((animation.getTypeMask() & WindowInsetsCompat.Type.navigationBars()) != 0) {
                    isWindowInsetsAnimationRunning = false;
                }
            }
        });

        // Setup insets listener
        ViewCompat.setOnApplyWindowInsetsListener(this, (v, windowInsets) -> {
            applyWindowInsets(windowInsets);
            return windowInsets;
        });
    }

    /**
     * Apply live window insets from WindowInsetsCompat.Type.navigationBars().
     * Never hardcodes a height.
     */
    public void applyWindowInsets(@Nullable WindowInsetsCompat windowInsets) {
        if (windowInsets == null) return;
        Insets navInsets = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
        updateTargetHeight(navInsets.bottom);
    }

    /**
     * Updates height to match targetHeight. If targetHeight is 0 (hidden/immersive/gesture 0),
     * animates to 0 height and collapses with no leftover gap.
     * When returning, animates height and alpha over ~150 ms.
     */
    public void updateTargetHeight(int targetHeight) {
        if (currentTargetHeight == targetHeight && !isWindowInsetsAnimationRunning) {
            return;
        }
        currentTargetHeight = targetHeight;

        if (isWindowInsetsAnimationRunning) {
            return;
        }

        if (heightAnimator != null) {
            heightAnimator.cancel();
        }

        int currentHeight = (getLayoutParams() != null && getLayoutParams().height >= 0)
                ? getLayoutParams().height
                : getHeight();

        if (targetHeight == 0) {
            // Navigation bar is hidden (immersive, fullscreen, or gesture with 0 inset)
            if (currentHeight == 0 || getVisibility() == View.GONE) {
                setExactHeight(0);
                setVisibility(View.GONE);
                return;
            }

            final int startHeight = currentHeight;
            heightAnimator = ValueAnimator.ofFloat(1.0f, 0.0f);
            heightAnimator.setDuration(NavBarConstants.ANIM_DURATION_MS);
            heightAnimator.setInterpolator(new DecelerateInterpolator());
            heightAnimator.addUpdateListener(anim -> {
                float fraction = (float) anim.getAnimatedValue();
                setExactHeight(Math.round(startHeight * fraction));
                setAlpha(fraction);
            });
            heightAnimator.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    setExactHeight(0);
                    setVisibility(View.GONE);
                    setAlpha(1.0f);
                }
            });
            heightAnimator.start();
        } else {
            // Navigation bar returned (swipe-reveal, exiting fullscreen, mode change)
            setVisibility(View.VISIBLE);
            final int startHeight = Math.max(0, currentHeight);
            final float startAlpha = (startHeight == 0) ? 0.0f : getAlpha();
            setAlpha(startAlpha);

            heightAnimator = ValueAnimator.ofFloat(0.0f, 1.0f);
            heightAnimator.setDuration(NavBarConstants.ANIM_DURATION_MS);
            heightAnimator.setInterpolator(new DecelerateInterpolator());
            heightAnimator.addUpdateListener(anim -> {
                float fraction = (float) anim.getAnimatedValue();
                int h = Math.round(startHeight + (targetHeight - startHeight) * fraction);
                setExactHeight(h);
                setAlpha(startAlpha + (1.0f - startAlpha) * fraction);
            });
            heightAnimator.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    setExactHeight(targetHeight);
                    setAlpha(1.0f);
                }
            });
            heightAnimator.start();
        }
    }

    private void setExactHeight(int heightPx) {
        ViewGroup.LayoutParams lp = getLayoutParams();
        if (lp != null && lp.height != heightPx) {
            lp.height = heightPx;
            setLayoutParams(lp);
        }
        if (heightPx <= 0) {
            setVisibility(View.GONE);
        } else {
            setVisibility(View.VISIBLE);
        }
        requestLayout();
        invalidate();
    }

    public void setDarkMode(boolean isDark) {
        this.isDarkMode = isDark;
        updateBackgroundColor();
    }

    private void updateBackgroundColor() {
        setBackgroundColor(isDarkMode ? NavBarConstants.COLOR_DARK : NavBarConstants.COLOR_LIGHT);
        invalidate();
    }

    @Override
    protected void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        int nightMode = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;
        isDarkMode = (nightMode == Configuration.UI_MODE_NIGHT_YES);
        updateBackgroundColor();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if (getVisibility() != View.VISIBLE || getHeight() <= 0) {
            return;
        }
        super.onDraw(canvas);
    }
}
