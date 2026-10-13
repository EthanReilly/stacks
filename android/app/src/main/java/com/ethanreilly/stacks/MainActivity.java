package com.ethanreilly.stacks;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Draw behind the status and navigation bars on every Android version;
        // the page pads itself using the safe-area values Capacitor provides.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
