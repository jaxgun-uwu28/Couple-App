package com.pawandus.app;

import android.os.Debug;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Local diagnostics only: current process PSS, not the isolated WebView renderer.
@CapacitorPlugin(name = "PerformanceMemory")
public class PerformanceMemoryPlugin extends Plugin {
    @PluginMethod
    public void read(PluginCall call) {
        Debug.MemoryInfo info = new Debug.MemoryInfo();
        Debug.getMemoryInfo(info);
        JSObject result = new JSObject();
        result.put("pssKiB", info.getTotalPss());
        call.resolve(result);
    }
}
