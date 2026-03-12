Feature: 自動生成 HIL 驗證腳本
  為了加速硬體在環測試的設置
  作為一名驗證工程師
  我希望從自然語言需求直接生成 Python 測試腳本

  Scenario: 為延遲需求生成 PyAnsys 腳本
    Given 一個需求節點 "REQ-LAT-01" 描述為 "煞車響應時間必須小於 20ms"
    And 目標測試環境設定為 "PyAnsys"
    When 我執行 "Generate HIL Script" 動作
    Then 系統應生成一個名為 "test_brake_latency.py" 的檔案
    And 該檔案應包含有效的 Python 語法 (通過 AST 解析驗證)
    And 該檔案應導入 "pyansys" 函式庫
    And 生成的代碼應包含斷言邏輯 "assert response_time < 0.02"
    And 該腳本應通過靜態代碼分析工具 (Pylint) 的檢查
