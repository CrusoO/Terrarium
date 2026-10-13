# Corporate TLS (Zscaler / proxy)

If HTTPS is intercepted on your network, Python inside Docker cannot use the Windows trust store. Export your org root CA here as `zscaler-root.pem` (gitignored).

**PowerShell (Zscaler Root CA in Local Machine store):**

```powershell
$dest = "infra/certs"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$cert = Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like '*CN=Zscaler Root CA*' } | Select-Object -First 1
$b64 = [Convert]::ToBase64String($cert.RawData, 'InsertLineBreaks')
"-----BEGIN CERTIFICATE-----`n$b64`n-----END CERTIFICATE-----`n" | Set-Content "$dest/zscaler-root.pem" -Encoding ascii
```

`docker-compose.yml` mounts this folder and sets `TERRARIUM_EXTRA_CA_FILE`. Restart `api` and `worker` after adding the PEM.

Note: traffic may still be MITM'd even when the Zscaler client is “off”; trust the cert chain you actually see (browser or `openssl s_client`).
