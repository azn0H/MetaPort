<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>Stav Raspberry Pi</title>
    <style>
        body { font-family: sans-serif; background: #222; color: #fff; text-align: center; padding: 50px; }
        .box { background: #333; padding: 20px; margin: 10px; border-radius: 10px; display: inline-block; width: 200px; }
        h2 { margin: 0; color: #aaa; font-size: 16px; }
        .value { font-size: 32px; font-weight: bold; color: #4CAF50; }
        .warning { color: #FF9800; }
        .danger { color: #F44336; }
    </style>
</head>
<body>

<h1>Raspberry Pi 5 - Monitor</h1>

<?php
// 1. TEPLOTA CPU
// Přečteme soubor, vydělíme 1000 (je to v milistupních)
$tempRaw = file_get_contents("/sys/class/thermal/thermal_zone0/temp");
$temp = round($tempRaw / 1000, 1);

// Barvičky podle teploty
$tempColor = "value";
if ($temp > 60) $tempColor = "warning";
if ($temp > 80) $tempColor = "danger";

// 2. DISK (Volné místo)
// disk_free_space vrací byty -> převedeme na GB
$freeSpace = round(disk_free_space("/") / 1024 / 1024 / 1024, 1);
$totalSpace = round(disk_total_space("/") / 1024 / 1024 / 1024, 1);

// 3. RAM (Využití paměti)
// Přečteme /proc/meminfo
$memInfo = file_get_contents("/proc/meminfo");
preg_match('/MemTotal:\s+(\d+)/', $memInfo, $totalMatches);
preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $availableMatches);
$memTotal = round($totalMatches[1] / 1024, 0); // MB
$memAvail = round($availableMatches[1] / 1024, 0); // MB
$memUsed = $memTotal - $memAvail;

// 4. UPTIME (Jak dlouho běží)
$uptime = shell_exec("uptime -p"); // Použijeme příkaz Linuxu
?>

<div class="box">
    <h2>Teplota CPU</h2>
    <div class="<?php echo $tempColor; ?>"><?php echo $temp; ?> °C</div>
</div>

<div class="box">
    <h2>Volné místo</h2>
    <div class="value"><?php echo $freeSpace; ?> GB</div>
    <small>z <?php echo $totalSpace; ?> GB</small>
</div>

<div class="box">
    <h2>RAM (Využito)</h2>
    <div class="value"><?php echo $memUsed; ?> MB</div>
    <small>Celkem: <?php echo $memTotal; ?> MB</small>
</div>

<div class="box">
    <h2>Běží už</h2>
    <div style="font-size: 14px; margin-top: 10px;"><?php echo $uptime; ?></div>
</div>

</body>
</html>
