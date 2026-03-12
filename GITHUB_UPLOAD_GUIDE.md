# 如何上傳 AegisVee 到 GitHub

已經為你準備好了 Git 儲存庫和打包檔案。請按照以下步驟操作：

## 第一步：上傳原始碼 (Source Code)

打開終端機 (Terminal) 或 PowerShell，執行以下指令將程式碼推送到 GitHub：

```powershell
# 1. 確保你在正確目錄
cd d:\Work\aegis-vee-mvp

# 2. 推送程式碼到 GitHub
git push -u origin main
```

> 如果出現登入提示，請輸入你的 GitHub 帳號密碼（或 Token）。

---

## 第二步：發布 Release (執行檔)

由於執行檔太大 (約 860 MB)，不能直接用 git push，必須使用 **GitHub Releases** 功能。

1. **打開瀏覽器**，前往你的儲存庫：
   👉 [https://github.com/djhungtim/AegisVee/releases/new](https://github.com/djhungtim/AegisVee/releases/new)

2. **填寫發布資訊**：
   - **Choose a tag**: 輸入 `v2.1.0` 並點選 "Create new tag"
   - **Release title**: 輸入 `AegisVee v2.1.0 MVP`
   - **Description**: 可以貼上 `INSTALL.md` 的內容，或簡單寫 "AegisVee v2.1.0 with new logo and frontend auto-refresh feature".

3. **上傳檔案**：
   - 找到下方的 **"Attach binaries by dropping them here..."** 區域
   - 將 `d:\Work\aegis-vee-mvp\release\AegisVee-Basic-v2.1.0-win-x64.zip` 與 `AegisVee-Advanced-v*-win-x64.zip` 都拖拉進去
   - 等待上傳完成 (進度條跑完)

4. **發布**：
   - 點選綠色的 **"Publish release"** 按鈕

---

## 第三步：分享連結

發布成功後，你的下載連結會是：
<https://github.com/djhungtim/AegisVee/releases/latest>

你可以將此連結分享給其他人，他們就能下載並安裝使用了！
