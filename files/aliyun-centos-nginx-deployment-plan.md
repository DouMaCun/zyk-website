# 阿里云 CentOS + Nginx 静态官网部署方案

## 0. 变量

```bash
DOMAIN=www.example.com
ROOT=/var/www/cishicike-website
CONF=/etc/nginx/conf.d/cishicike-website.conf
```

本地替换：

```text
SERVER_IP=你的 ECS 公网 IP
```

## 1. 阿里云侧

ECS 安全组入方向放通：

- `22/tcp`：建议仅办公 IP
- `80/tcp`：`0.0.0.0/0`
- `443/tcp`：`0.0.0.0/0`

大陆地域绑定域名对外访问时，先完成 ICP 备案，并替换页脚备案号。

## 2. 服务器安装 Nginx

CentOS 7：

```bash
yum install -y epel-release nginx
systemctl enable --now nginx
```

CentOS 8 / Stream：

```bash
dnf install -y nginx
systemctl enable --now nginx
```

如启用 firewalld：

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## 3. 创建站点目录

```bash
mkdir -p "$ROOT"
chown -R root:root "$ROOT"
chmod -R 755 "$ROOT"
```

## 4. 上传文件

在本地项目根目录执行：

```powershell
scp .\index.html .\terms.html .\privacy.html .\refund.html .\merchant-agreement.html root@SERVER_IP:/var/www/cishicike-website/
scp -r .\assets root@SERVER_IP:/var/www/cishicike-website/
```

服务器确认：

```bash
find "$ROOT" -maxdepth 3 -type f
```

## 5. Nginx 配置

```bash
cat > "$CONF" <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.example.com example.com SERVER_IP;

    root /var/www/cishicike-website;
    index index.html;
    charset utf-8;

    access_log /var/log/nginx/cishicike-website.access.log;
    error_log  /var/log/nginx/cishicike-website.error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|png|jpg|jpeg|gif|webp|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        try_files $uri =404;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
EOF
```

把配置里的 `www.example.com example.com SERVER_IP` 改成真实域名/IP：

```bash
vi "$CONF"
nginx -t && systemctl reload nginx
```

## 6. 验证

```bash
curl -I http://127.0.0.1
curl -I http://SERVER_IP
curl -I http://SERVER_IP/assets/css/style.css
```

浏览器检查：

- `http://SERVER_IP`
- `http://DOMAIN`
- 首页、协议页、隐私页、售后页、商户协议页
- 图片、CSS、JS 正常加载

## 7. HTTPS

CentOS 7：

```bash
yum install -y certbot python3-certbot-nginx || yum install -y certbot python2-certbot-nginx
certbot --nginx -d www.example.com -d example.com
certbot renew --dry-run
```

CentOS 8 / Stream：

```bash
dnf install -y certbot python3-certbot-nginx
certbot --nginx -d www.example.com -d example.com
certbot renew --dry-run
```

## 8. 后续发布

只传变更文件即可，静态资源更新通常不需要 reload Nginx。

```powershell
scp .\index.html root@SERVER_IP:/var/www/cishicike-website/
scp .\assets\css\style.css root@SERVER_IP:/var/www/cishicike-website/assets/css/
```

## 9. 回滚

上线前：

```bash
cp -a "$ROOT" "$ROOT.bak.$(date +%Y%m%d%H%M%S)"
```

回滚：

```bash
rm -rf "$ROOT"
cp -a /var/www/cishicike-website.bak.YYYYMMDDHHMMSS "$ROOT"
nginx -t && systemctl reload nginx
```

## 10. 典型问题快速定位

```bash
systemctl status nginx
nginx -t
ss -lntp | grep nginx
tail -n 100 /var/log/nginx/cishicike-website.error.log
namei -l "$ROOT/index.html"
getenforce
```

SELinux 拦截时：

```bash
restorecon -Rv "$ROOT"
```
