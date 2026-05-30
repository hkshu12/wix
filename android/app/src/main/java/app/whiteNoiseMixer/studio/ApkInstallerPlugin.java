package app.whiteNoiseMixer.studio;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.List;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    private static final String APK_MIME = "application/vnd.android.package-archive";

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            result.put("allowed", getContext().getPackageManager().canRequestPackageInstalls());
        } else {
            result.put("allowed", true);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            Activity activity = getActivity();
            if (activity != null) {
                activity.startActivity(intent);
            } else {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void install(PluginCall call) {
        String uriValue = call.getString("uri");
        if (uriValue == null || uriValue.isBlank()) {
            call.reject("Missing APK uri");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        Uri contentUri = resolveInstallableUri(uriValue);
        if (contentUri == null) {
            call.reject("APK file not found");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(contentUri, APK_MIME);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.setClipData(ClipData.newRawUri("", contentUri));

        PackageManager packageManager = activity.getPackageManager();
        List<ResolveInfo> handlers =
            packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        for (ResolveInfo handler : handlers) {
            String packageName = handler.activityInfo.packageName;
            activity.grantUriPermission(
                packageName,
                contentUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );
        }

        try {
            activity.startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException error) {
            call.reject("No app can install APK packages", error);
        }
    }

    private Uri resolveInstallableUri(String uriValue) {
        File apkFile = resolveApkFile(uriValue);
        if (apkFile == null || !apkFile.exists()) {
            return null;
        }

        return FileProvider.getUriForFile(
            getContext(),
            getContext().getPackageName() + ".fileprovider",
            apkFile
        );
    }

    private File resolveApkFile(String uriValue) {
        if (uriValue.startsWith("file://")) {
            return new File(Uri.parse(uriValue).getPath());
        }

        if (uriValue.startsWith("content://")) {
            Uri contentUri = Uri.parse(uriValue);
            File fromProvider = resolveFileFromFileProviderUri(contentUri);
            if (fromProvider != null) {
                return fromProvider;
            }

            return copyContentUriToInstallCache(contentUri);
        }

        if (uriValue.startsWith("/")) {
            return new File(uriValue);
        }

        return new File(getContext().getCacheDir(), uriValue);
    }

    private File resolveFileFromFileProviderUri(Uri contentUri) {
        String authority = getContext().getPackageName() + ".fileprovider";
        if (!authority.equals(contentUri.getAuthority())) {
            return null;
        }

        List<String> segments = contentUri.getPathSegments();
        if (segments == null || segments.size() < 2) {
            return null;
        }

        String mappedRoot = segments.get(0);
        String relativePath = String.join("/", segments.subList(1, segments.size()));

        if ("my_cache_images".equals(mappedRoot)) {
            return new File(getContext().getCacheDir(), relativePath);
        }

        if ("my_images".equals(mappedRoot)) {
            File externalRoot = getContext().getExternalFilesDir(null);
            if (externalRoot == null) {
                return null;
            }
            return new File(externalRoot, relativePath);
        }

        return null;
    }

    private File copyContentUriToInstallCache(Uri contentUri) {
        File destination = new File(getContext().getCacheDir(), "updates/install-pending.apk");
        File parent = destination.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        try (
            InputStream input = getContext().getContentResolver().openInputStream(contentUri);
            FileOutputStream output = new FileOutputStream(destination, false)
        ) {
            if (input == null) {
                return null;
            }

            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            return destination;
        } catch (Exception error) {
            return null;
        }
    }
}
