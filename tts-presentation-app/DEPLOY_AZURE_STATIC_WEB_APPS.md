## Deploy frontend (Vite React) lên Azure Static Web Apps

### 1) Tổng quan
- Phù hợp cho SPA build tĩnh (Vite output `dist/`).
- Tự động CI/CD qua GitHub, miễn phí SSL, CDN global, routing SPA.
- Backend của bạn chạy riêng (Azure Web App) tại: `https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net` (tham khảo tài liệu: [`/docs`](https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net/docs), [`/openapi.json`](https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net/openapi.json)).

### 2) Chuẩn bị cấu hình môi trường production
- Tạo file `.env.production` trong thư mục `tts-presentation-app`:

```bash
VITE_API_BASE_URL=https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net
VITE_API_PREFIX=/api/v1
```

Ghi chú:
- Biến `VITE_*` sẽ được Vite inject lúc build (compile-time). Không cần proxy khi production.
- Nếu không muốn commit `.env.production`, bạn có thể tạo file này động trong GitHub Actions (xem bước 4).

### 3) (Khuyến nghị) Cấu hình SPA fallback
- Để route client-side (react-router) hoạt động khi refresh, thêm file `staticwebapp.config.json` (cùng cấp `index.html`) với nội dung:

```json
{
  "navigationFallback": { "rewrite": "/index.html" }
}
```

### 4) Tạo Static Web App trên Azure Portal (bằng GitHub)
1. Push toàn bộ mã nguồn lên GitHub.
2. Mở Azure Portal → tìm “Static Web Apps” → Create.
3. Chọn Subscription, Resource Group (tạo mới nếu cần), đặt tên app.
4. Hosting plan: Free (hoặc Standard nếu cần tính năng nâng cao), chọn Region gần người dùng.
5. Deployment details → "Sign in with GitHub" → chọn Organization, Repository, Branch.
6. Build Details:
   - App location: `tts-presentation-app`
   - Api location: (để trống)
   - Output location: `dist`
7. Review + Create → Create. Azure sẽ tạo GitHub Actions workflow trong repo.
8. Vào GitHub → tab Actions → chờ workflow build & deploy thành công.

Nếu không commit `.env.production`, thêm bước tạo file env trong workflow:

```yaml
      - name: Create .env.production
        working-directory: tts-presentation-app
        run: |
          cat > .env.production << 'EOF'
          VITE_API_BASE_URL=https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net
          VITE_API_PREFIX=/api/v1
          EOF
```

Hoặc dùng GitHub Secrets (không commit giá trị vào repo):

```yaml
      - name: Create .env.production from secrets
        if: ${{ env.USE_SECRETS == 'true' }}
        working-directory: tts-presentation-app
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_API_PREFIX: ${{ secrets.VITE_API_PREFIX }}
        run: |
          cat > .env.production << EOF
          VITE_API_BASE_URL=${VITE_API_BASE_URL}
          VITE_API_PREFIX=${VITE_API_PREFIX}
          EOF
```

### 5) Build local để kiểm tra (tùy chọn)

```bash
cd tts-presentation-app
npm ci || npm install
npm run build
npx serve -s dist  # hoặc dùng bất kỳ static server nào để xem thử
```

### 6) Cấu hình CORS trên Backend
- FE production sẽ chạy trên domain `https://<your-app>.azurestaticapps.net` (hoặc custom domain của bạn).
- Hãy mở CORS trên BE cho domain này để tránh lỗi “Network Error/CORS”.
- Prefix API xác nhận là `/api/v1` theo tài liệu [`/openapi.json`](https://mc-ctx-bot-app-dfa2gmaddhc8f5dh.southeastasia-01.azurewebsites.net/openapi.json).

### 7) Custom domain và HTTPS
- Trong Static Web App → Custom domains → Add → xác thực DNS CNAME → Azure sẽ cấp SSL tự động.

### 8) Mẹo triển khai và xử lý sự cố
- 404 khi refresh: thiếu `staticwebapp.config.json` với `navigationFallback`.
- FE vẫn gọi localhost: đặt đúng `.env.production` và rebuild; trên production không dùng Vite proxy.
- CORS lỗi: bật origin FE domain trên BE.
- Kiểm tra log build: tab Actions của GitHub → workflow do Azure tạo.

### 9) Kiến trúc thay thế (tránh CORS hoàn toàn)
- Dùng Azure Front Door: route `/*` → FE (SWA), `/api/*` → BE (Azure Web App). FE giữ `VITE_API_BASE_URL` trỏ cùng domain qua reverse proxy.

---
Checklist nhanh:
- [ ] `.env.production` chứa `VITE_API_BASE_URL` và `VITE_API_PREFIX`
- [ ] (Khuyến nghị) `staticwebapp.config.json` có `navigationFallback`
- [ ] Kết nối GitHub và chọn đúng App location `tts-presentation-app`, Output `dist`
- [ ] Mở CORS trên BE cho domain FE
- [ ] Kiểm tra trang chạy OK sau deploy

