# OrientDB configurations

You can set the root user in `orientdb-server-config.xml`

```xml
    <users>
        <user name="root" password="{PBKDF2WithHmacSHA256}55F3DEAE:DLJEJFDKY8:65536" resources="*" />
        <user name="guest" password="{PBKDF2WithHmacSHA256}B36E7993C961:C8C8B36F3:65536" resources="connect,server.listDatabases,server.dblist" />
    </users>
```
