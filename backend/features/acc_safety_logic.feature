Feature: ACC 安全車距邏輯定義與生成
  為了確保車輛在高速行駛時保持安全距離
  作為一名功能安全工程師
  我希望定義車距公式並自動生成驗證代碼

  Background:
    Given 專案 "ACC-Project" 已加載 ISO-26262 規則集
    And 我在畫布上創建了一個邏輯節點 "LOGIC-001"

  Scenario Outline: 驗證使用者輸入的公式語法
    When 我在節點 "LOGIC-001" 輸入公式 "<formula>"
    Then 節點狀態應變為 "<status>"
    And AI 驗證模組應返回 "<validation_result>"

    Examples:
      | formula             | status | validation_result |
      | dist > speed * 0.5  | Valid  | Pass              |
      | dist > speed / 0    | Error  | Division by zero  |
      | dist = "too close"  | Error  | Type mismatch     |

  Scenario: 生成 Python 驗證腳本
    Given 節點 "LOGIC-001" 的公式為 "dist > speed * 0.5"
    When 我點擊 "Generate Test Script" 按鈕
    Then 系統應生成 Python 代碼
    And 生成的代碼應包含 AST 節點 "Compare"
    And 生成的代碼應正確處理輸入變數 "dist" 和 "speed"
