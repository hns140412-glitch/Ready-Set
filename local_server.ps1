param([int]$Port = 8080)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
function CType([string]$p) {
  switch ([IO.Path]::GetExtension($p).ToLowerInvariant()) {
    ".html" {"text/html; charset=utf-8"} ".js" {"application/javascript; charset=utf-8"} ".css" {"text/css; charset=utf-8"}
    ".json" {"application/json; charset=utf-8"} ".png" {"image/png"} ".jpg" {"image/jpeg"} ".jpeg" {"image/jpeg"}
    ".svg" {"image/svg+xml"} ".wav" {"audio/wav"} ".mp3" {"audio/mpeg"} ".webmanifest" {"application/manifest+json"}
    default {"application/octet-stream"}
  }
}
function New-Listener([int]$p) {
  $l=New-Object System.Net.HttpListener
  $l.Prefixes.Add("http://localhost:$p/")
  $l.Start()
  return $l
}
try {$listener=New-Listener $Port} catch {$Port=8081;$listener=New-Listener $Port}
$url="http://localhost:$Port/"
Write-Host ""
Write-Host "=========================================="
Write-Host " TimeAttack PWA PC Test"
Write-Host " $url"
Write-Host " Close this window to stop."
Write-Host "=========================================="
Start-Process $url
try {
  while($listener.IsListening){
    $ctx=$listener.GetContext()
    $rel=[Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if([string]::IsNullOrWhiteSpace($rel)){$rel="index.html"}
    $full=[IO.Path]::GetFullPath((Join-Path $Root ($rel -replace "/", "\")))
    $rootFull=[IO.Path]::GetFullPath($Root)
    if(-not $full.StartsWith($rootFull,[StringComparison]::OrdinalIgnoreCase)){$ctx.Response.StatusCode=403;$ctx.Response.Close();continue}
    if(Test-Path $full -PathType Container){$full=Join-Path $full "index.html"}
    if(Test-Path $full -PathType Leaf){
      $bytes=[IO.File]::ReadAllBytes($full);$ctx.Response.StatusCode=200;$ctx.Response.ContentType=CType $full;$ctx.Response.ContentLength64=$bytes.Length;$ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
    }else{$msg=[Text.Encoding]::UTF8.GetBytes("404 Not Found");$ctx.Response.StatusCode=404;$ctx.Response.ContentType="text/plain";$ctx.Response.ContentLength64=$msg.Length;$ctx.Response.OutputStream.Write($msg,0,$msg.Length)}
    $ctx.Response.OutputStream.Close()
  }
} finally {if($listener){$listener.Stop();$listener.Close()}}
