Feature: AI 輔助需求分解與優化
  為了減少撰寫重複性合規文檔的時間（降低創意稅）
  作為一名需求工程師
  我希望 AI 能根據高層概念自動生成詳細的系統需求

  Rule: AI 生成的內容必須符合 EARS (Easy Approach to Requirements Syntax) 語法標準

  Scenario: 從操作概念生成系統需求
    Given 我已選擇 "緊急煞車策略" 的操作概念節點
    And 本地 RAG 引擎已加載 "ISO-26262-Part3.pdf" 作為上下文
    When 我請求 AI "分解此概念為具體的功能安全需求"
    Then AI 應生成至少 3 個子需求節點
    And 所有生成的節點描述應包含關鍵字 "['shall', 'brake', 'emergency']"
    And 每個生成的需求應符合 EARS 模板結構 "<Condition> <System Name> shall <System Response>"
    And 系統不應發送任何網路請求至外部 API (確保 Air-Gapped)
