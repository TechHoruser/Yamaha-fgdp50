package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

const apiURL = "https://api.github.com/repos/TechHoruser/Yamaha-fgdp50/releases/latest"

type UpdateInfo struct {
	HasUpdate      bool   `json:"hasUpdate"`
	LatestVersion  string `json:"latestVersion"`
	CurrentVersion string `json:"currentVersion"`
	DownloadURL    string `json:"downloadURL"`
	ReleaseNotes   string `json:"releaseNotes"`
}

type githubRelease struct {
	TagName string `json:"tag_name"`
	Body    string `json:"body"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

func Check(currentVersion string) (UpdateInfo, error) {
	info := UpdateInfo{CurrentVersion: currentVersion}

	// Never prompt for updates in dev builds.
	if currentVersion == "dev" || currentVersion == "" {
		return info, nil
	}

	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return info, err
	}
	req.Header.Set("User-Agent", "fgdp-looper-updater")
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return info, err
	}
	defer resp.Body.Close()

	// 404 means no releases published yet — not an error.
	if resp.StatusCode == http.StatusNotFound {
		return info, nil
	}
	if resp.StatusCode != http.StatusOK {
		return info, fmt.Errorf("github api returned %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return info, err
	}

	info.LatestVersion = release.TagName
	info.ReleaseNotes = release.Body
	info.HasUpdate = isNewer(release.TagName, currentVersion)

	if info.HasUpdate {
		info.DownloadURL = assetURL(release, runtime.GOOS)
	}

	return info, nil
}

// DownloadInstaller downloads the installer to a temp file and returns its path.
func DownloadInstaller(downloadURL string) (string, error) {
	resp, err := http.Get(downloadURL) //nolint:gosec
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	parts := strings.Split(downloadURL, "/")
	filename := parts[len(parts)-1]
	dest := filepath.Join(os.TempDir(), filename)

	out, err := os.Create(dest)
	if err != nil {
		return "", err
	}
	defer out.Close()

	if _, err = io.Copy(out, resp.Body); err != nil {
		return "", err
	}
	return dest, nil
}

// LaunchInstaller starts the NSIS installer and exits the current process
// so the installer can replace the running binary.
func LaunchInstaller(installerPath string) error {
	if runtime.GOOS != "windows" {
		return fmt.Errorf("automatic install only supported on Windows")
	}
	cmd := exec.Command("cmd", "/C", "start", "", installerPath)
	if err := cmd.Start(); err != nil {
		return err
	}
	os.Exit(0)
	return nil
}

// assetURL picks the platform-appropriate download URL from a release.
func assetURL(release githubRelease, goos string) string {
	for _, a := range release.Assets {
		switch goos {
		case "windows":
			if strings.HasSuffix(a.Name, "-installer.exe") {
				return a.BrowserDownloadURL
			}
		case "darwin":
			if strings.HasSuffix(a.Name, ".zip") {
				return a.BrowserDownloadURL
			}
		}
	}
	return ""
}

func isNewer(latest, current string) bool {
	l := parseVer(latest)
	c := parseVer(current)
	for i := range l {
		if l[i] > c[i] {
			return true
		}
		if l[i] < c[i] {
			return false
		}
	}
	return false
}

func parseVer(v string) [3]int {
	v = strings.TrimPrefix(v, "v")
	parts := strings.SplitN(v, ".", 3)
	var out [3]int
	for i, p := range parts {
		if i >= 3 {
			break
		}
		out[i], _ = strconv.Atoi(p)
	}
	return out
}
