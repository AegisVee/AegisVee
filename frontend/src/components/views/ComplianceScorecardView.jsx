/**
 * ComplianceScorecardView — ASPICE SYS.1-SYS.5 Compliance Dashboard
 *
 * Displays:
 * - Overall compliance percentage
 * - Per-process (SYS.1-SYS.5) BP completion rates
 * - Work product status (13 WP types)
 * - BGB Rating Rules check
 * - Consistency issues with auto-generate evidence button
 */

import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Progress,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Alert,
  Typography,
  Collapse,
  List,
  Badge,
  Tooltip,
  message,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import { useCompliance } from "../../hooks/useCompliance";

const { Text, Title } = Typography;

// ─── Process Score Card ─────────────────────────────────────────
function ProcessCard({ data }) {
  if (!data) return null;
  const { process, name, bp_score, bp_percent, bp_completion } = data;

  const color =
    bp_percent >= 80 ? "#52c41a" : bp_percent >= 50 ? "#faad14" : "#ff4d4f";

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{process}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{name}</Text>
        </Space>
      }
      extra={
        <Text strong style={{ color }}>
          {bp_score}
        </Text>
      }
      style={{ marginBottom: 8 }}
    >
      <Progress percent={bp_percent} strokeColor={color} size="small" />
      <Collapse ghost size="small" style={{ marginTop: 8 }}>
        <Collapse.Panel header="Base Practices" key="1">
          <List
            size="small"
            dataSource={Object.entries(bp_completion || {})}
            renderItem={([bp, done]) => (
              <List.Item>
                <Space>
                  {done ? (
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                  )}
                  <Text style={{ fontSize: 12 }}>
                    {bp.replace(/_/g, " ")}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </Collapse.Panel>
      </Collapse>
    </Card>
  );
}

// ─── Main View ─────────────────────────────────────────────────
export default function ComplianceScorecardView({ projectId }) {
  const {
    scorecard,
    workProducts,
    bgbCheck,
    consistencyReport,
    summary,
    loading,
    overallPercent,
    populatedWorkProducts,
    loadAll,
    runConsistencyChecks,
    generateConsistencyEvidence,
  } = useCompliance(projectId);

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = () => loadAll();

  const handleRunConsistency = async () => {
    await runConsistencyChecks();
  };

  const handleGenerateEvidence = async () => {
    setGenerating(true);
    try {
      const result = await generateConsistencyEvidence();
      message.success(`Generated ${result?.generated || 0} evidence record(s)`);
      await loadAll();
    } finally {
      setGenerating(false);
    }
  };

  const overallColor =
    overallPercent >= 80 ? "#52c41a" : overallPercent >= 50 ? "#faad14" : "#ff4d4f";

  // Work product table columns
  const wpColumns = [
    { title: "WP ID", dataIndex: "wp_id", width: 70 },
    { title: "Work Product", dataIndex: "name", ellipsis: true },
    {
      title: "Entities",
      dataIndex: "count",
      width: 80,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (v) =>
        v === "populated" ? (
          <Tag color="success">Populated</Tag>
        ) : (
          <Tag color="default">Empty</Tag>
        ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <Space style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>ASPICE Compliance Scorecard</Title>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} size="small" loading={loading}>
          Refresh
        </Button>
      </Space>

      <Spin spinning={loading}>
        {/* Overall Score */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Progress
                type="circle"
                percent={overallPercent}
                strokeColor={overallColor}
                width={80}
              />
              <div style={{ marginTop: 8 }}>
                <Text strong>Overall ASPICE</Text>
              </div>
              {scorecard?.overall && (
                <Text type="secondary">
                  {scorecard.overall.completed_bp}/{scorecard.overall.total_bp} BP
                </Text>
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Work Products Populated"
                value={populatedWorkProducts}
                suffix={`/ ${workProducts.length}`}
                valueStyle={{
                  color: populatedWorkProducts === workProducts.length ? "#52c41a" : "#faad14",
                }}
                prefix={<FileProtectOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="BGB Rules Passed"
                value={bgbCheck?.passed || 0}
                suffix={`/ ${bgbCheck?.total || 0}`}
                valueStyle={{
                  color: bgbCheck?.percent === 100 ? "#52c41a" : "#faad14",
                }}
              />
              {bgbCheck && (
                <Progress
                  percent={bgbCheck.percent}
                  size="small"
                  showInfo={false}
                  style={{ marginTop: 4 }}
                />
              )}
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Open Consistency Issues"
                value={consistencyReport?.total_issues ?? "—"}
                valueStyle={{
                  color:
                    (consistencyReport?.total_issues || 0) === 0 ? "#52c41a" : "#ff4d4f",
                }}
                prefix={<ThunderboltOutlined />}
              />
              <Space style={{ marginTop: 8 }} size={4}>
                <Button size="small" onClick={handleRunConsistency}>
                  Check
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleGenerateEvidence}
                  loading={generating}
                >
                  Generate Evidence
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Process Scorecards */}
        {scorecard?.processes && (
          <>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Process Breakdown (SYS.1–SYS.5)
            </Text>
            <Row gutter={12} style={{ marginBottom: 16 }}>
              {Object.entries(scorecard.processes).map(([key, data]) => (
                <Col key={key} span={8}>
                  <ProcessCard data={data} />
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* BGB Rules Detail */}
        {bgbCheck?.checks && (
          <>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              BGB Rating Rules
            </Text>
            <List
              size="small"
              style={{ marginBottom: 16 }}
              dataSource={Object.entries(bgbCheck.checks)}
              renderItem={([rule, check]) => (
                <List.Item>
                  <Space>
                    {check.passed ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    )}
                    <Text code style={{ fontSize: 11 }}>{rule}</Text>
                    <Text type="secondary">{check.description}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {/* Work Products Table */}
        {workProducts.length > 0 && (
          <>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              Work Products (13 ASPICE Types)
            </Text>
            <Table
              dataSource={workProducts}
              columns={wpColumns}
              rowKey="wp_id"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </>
        )}

        {/* Consistency Issues */}
        {consistencyReport?.issues?.length > 0 && (
          <Alert
            type="warning"
            style={{ marginTop: 16 }}
            message={`${consistencyReport.total_issues} consistency issue(s) detected`}
            description={
              <Collapse ghost size="small">
                <Collapse.Panel header="View issues" key="1">
                  <List
                    size="small"
                    dataSource={consistencyReport.issues}
                    renderItem={(issue) => (
                      <List.Item>
                        <Space>
                          <Tag
                            color={
                              issue.severity === "high"
                                ? "error"
                                : issue.severity === "medium"
                                ? "warning"
                                : "default"
                            }
                          >
                            {issue.severity}
                          </Tag>
                          <Text style={{ fontSize: 12 }}>{issue.message}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Collapse.Panel>
              </Collapse>
            }
          />
        )}
      </Spin>
    </div>
  );
}
