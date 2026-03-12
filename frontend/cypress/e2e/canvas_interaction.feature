Feature: 視覺化藍圖上的節點操作與追溯性建立
  為了確保系統設計符合 V-Model 的追溯性要求
  作為一名系統架構師
  我希望能在畫布上直觀地連接與管理節點

  Background:
    Given 我已開啟 "Aegis-Demo-Project" 專案
    And "煞車系統架構圖" 處於編輯模式

  Scenario: 建立合法的需求驗證連結
    Given 畫布上存在一個需求節點 "REQ-001" 狀態為 "Draft"
    And 畫布上存在一個測試節點 "TEST-001" 狀態為 "Active"
    When 我從 "REQ-001" 的輸出埠拖曳連接線到 "TEST-001" 的輸入埠
    Then 兩者之間應建立一條 "Verification" 類型的連結
    And "REQ-001" 的屬性面板中應顯示 "Covered By: TEST-001"
    And 系統應自動生成一條合規性日誌 "Traceability link created by user"

  Scenario: 偵測潛在的循環依賴（Circular Dependency）
    Given 節點 "A" 連結到節點 "B"
    And 節點 "B" 連結到節點 "C"
    When 我嘗試建立從節點 "C" 到節點 "A" 的連結
    Then 系統應拒絕建立該連結
    And 應顯示錯誤訊息 "偵測到循環依賴，違反系統架構原則"
