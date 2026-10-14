package com.ethanreilly.stacks;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Capacitor applies the app theme and creates the WebView here. Edge-to-edge has to come
        // after that: touching the window earlier builds it with the launch theme's title bar.
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null || !(webView.getParent() instanceof View)) return;
        View host = (View) webView.getParent();
        // Show the theme's own background (light or dark) until the page has drawn.
        webView.setBackgroundColor(Color.TRANSPARENT);

        // Make room for the status bar, navigation bar and keyboard exactly once, here, and tell the
        // WebView they're already handled. If the WebView also sees the keyboard it shrinks the page a
        // second time, which is what squashed everything into a strip at the top.
        ViewCompat.setOnApplyWindowInsetsListener(host, (v, insets) -> {
            int bars = WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();
            int ime = WindowInsetsCompat.Type.ime();
            Insets sys = insets.getInsets(bars);
            Insets kb = insets.getInsets(ime);
            v.setPadding(sys.left, sys.top, sys.right, Math.max(sys.bottom, kb.bottom));
            // Zero rather than consume, so the WebView still gets told when the keyboard closes.
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(bars, Insets.NONE)
                .setInsets(ime, Insets.NONE)
                .build();
        });
        ViewCompat.requestApplyInsets(host);
    }
}
