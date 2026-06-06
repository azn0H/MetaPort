<?php
header('Content-Type: application/json');
error_reporting(0);

// --- POMOCNÁ FUNKCE ---
function get_path($path) {
    if (file_exists("/host_proc" . $path)) return "/host_proc" . $path;
    if (file_exists("/host_sys" . $path)) return "/host_sys" . $path;
    return $path;
}

// 1. TEPLOTA
$temp = 0;
$tempPath = get_path("/class/thermal/thermal_zone0/temp");
if (file_exists($tempPath)) {
    $temp = round(intval(file_get_contents($tempPath)) / 1000, 1);
}

// 2. RAM
$ramTotal = 0; $ramUsed = 0; $ramPercent = 0;
$memInfo = file_get_contents(get_path("/meminfo"));
preg_match('/MemTotal:\s+(\d+)/', $memInfo, $totalMatches);
preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $availMatches);

if (isset($totalMatches[1]) && isset($availMatches[1])) {
    $ramTotal = round($totalMatches[1] / 1024);
    $ramAvail = round($availMatches[1] / 1024);
    $ramUsed = $ramTotal - $ramAvail;
    if ($ramTotal > 0) $ramPercent = round(($ramUsed / $ramTotal) * 100);
}

// 3. ZÁTĚŽ CPU (Load)
$loadContent = file_get_contents(get_path("/loadavg"));
$loadArray = explode(" ", $loadContent);
$cpuLoad = $loadArray[0];

// --- NOVÉ: FREKVENCE CPU (MHz) ---
$cpuFreq = 0;
// Cesta k frekvenci prvního jádra
$freqPath = get_path("/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq");
if (file_exists($freqPath)) {
    // Hodnota je v kHz, dělíme 1000 pro MHz
    $cpuFreq = round(intval(file_get_contents($freqPath)) / 1000);
}

// --- NOVÉ: PING (Latency) ---
// Změříme čas připojení ke Google DNS (8.8.8.8)
$pingTime = 0;
$starttime = microtime(true);
$file      = @fsockopen("8.8.8.8", 53, $errno, $errstr, 0.5);
$stoptime  = microtime(true);
$status    = 0;

if ($file) {
    fclose($file);
    $status = 1;
    $pingTime = round(($stoptime - $starttime) * 1000); // ms
} else {
    $pingTime = "Timeout";
}

// --- NOVÉ: VERZE JÁDRA ---
$kernel = "Linux";
$versionPath = get_path("/version"); // /proc/version
if (file_exists($versionPath)) {
    $vContent = file_get_contents($versionPath);
    $parts = explode(" ", $vContent);
    // Většinou je to 3. slovo (Linux version 6.1.0...)
    if (isset($parts[2])) $kernel = $parts[2];
}


// 4. SÍŤ (Robustní verze)
$netRx = 0; $netTx = 0;
$netPath = get_path("/net/dev");
if (file_exists($netPath)) {
    $lines = file($netPath);
    foreach ($lines as $line) {
        if (strpos($line, ':') === false) continue;
        if (strpos($line, 'lo:') !== false) continue;
        if (strpos($line, 'veth') !== false) continue;
        if (strpos($line, 'docker') !== false) continue;
        if (strpos($line, 'br-') !== false) continue;
        
        $parts = explode(':', $line);
        $data = trim($parts[1]);
        preg_match_all('/(\d+)/', $data, $matches);
        if (count($matches[0]) >= 9) {
            $netRx += $matches[0][0];
            $netTx += $matches[0][8];
        }
    }
}
$netRxGB = round($netRx / 1024 / 1024 / 1024, 2);
$netTxGB = round($netTx / 1024 / 1024 / 1024, 2);

// 5. UPTIME
$uptimeRaw = file_get_contents(get_path("/uptime"));
$uptimeSec = intval(explode(" ", $uptimeRaw)[0]);
$dtF = new DateTime('@0');
$dtT = new DateTime("@$uptimeSec");
$uptime = $dtF->diff($dtT)->format('%a dní, %h hod, %i min');

// 6. DISK
$diskTotal = disk_total_space("/");
$diskFree = disk_free_space("/");
$diskPercent = round((($diskTotal - $diskFree) / $diskTotal) * 100);

// 7. MINECRAFT STATUS
$mcOnline = false;
$fp = @fsockopen("192.168.0.5", 25565, $errno, $errstr, 0.1);
if ($fp) { $mcOnline = true; fclose($fp); }

// ODESLÁNÍ JSON
echo json_encode([
    "cpu_model" => "Raspberry Pi 5",
    "cpu_freq" => $cpuFreq,       // NOVÉ
    "kernel" => $kernel,          // NOVÉ
    "ping" => $pingTime,          // NOVÉ
    "temp" => $temp,
    "ram_used" => $ramUsed,
    "ram_total" => $ramTotal,
    "ram_percent" => $ramPercent,
    "cpu_load" => $cpuLoad,
    "disk_percent" => $diskPercent,
    "disk_free_gb" => round($diskFree / 1024 / 1024 / 1024, 1),
    "uptime" => $uptime,
    "net_rx" => $netRxGB,
    "net_tx" => $netTxGB,
    "mc_status" => $mcOnline ? "ONLINE ✅" : "OFFLINE ❌"
]);
?>
