/**
 * TraceabilityMatrixView — Full bidirectional traceability matrix visualization
 *
 * Displays:
 * - Requirements → Architecture → Verification Measures → Results matrix
 * - Coverage statistics per entity type
 * - Gap detection panel
 * - Add/Delete traceability links
 */

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Row,
  Col,
  Card,
  Statistic,
  Alert,
  Typography,
  Tooltip,
  Badge,
  Spin,
  Collapse,
  List,
} from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useTraceability } from "../../hooks/useTraceability";

const { Text, Title } = Typography;

// ─── Coverage Card ─────────────────────────────────────────────
function CoverageCard({ entityType, data }) {
  const labels = {
    requirement: "Requirements",
    architecture: "Architecture",
    verification_measure: "Verification Measures",
    verification_result: "Verification Results",
  };
  const colors = {
    requirement: "#1677ff",
    architecture: "#722ed1",
    verification_measure: "#13c2c2",
    verification_result: "#52c41a",
  };

  if (!data) return null;

  return (
    <Card size="small" title={labels[entityType] || entityType}>
      <Statistic
        value={data.percent}
        suffix="%"
        valueStyle={{ color: colors[entityType] }}
      />
      <Text type="secondary">
        {data.traced} / {data.total} traced
      </Text>
      <Progress
        percent={data.percent}
        size="small"
        strokeColor={colors[entityType]}
        showInfo={false}
        style={{ marginTop: 4 }}
      />
    </Card>
  );
}

// ─── Matrix Row Renderer ────────────────────────────────────────
function MatrixRow({ row }) {
  const req = row.requirement;
  const statusBadge = {
    Verified: "success",
    Approved: "processing",
    Draft: "default",
    Rejected: "error",
  };

  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 0" }}>
      <Row gutter={8} align="middle">
        {/* Requirement */}
        <Col span={6}>
          <Space direction="vertical" size={0}>
            <Text code style={{ fontSize: 11 }}>{req.id}</Text>
            <Tooltip title={req.title}>
              <Text ellipsis style={{ maxWidth: 200, fontSize: 12 }}>
                {req.title}
              </Text>
            </Tooltip>
            <Badge status={statusBadge[req.status] || "default"} text={req.status} />
          </Space>
        </Col>

        {/* Architecture */}
        <Col span={5}>
          {row.architecture_elements.length === 0 ? (
            <Tag color="warning">None</Tag>
          ) : (
            <Space wrap size={2}>
              {row.architecture_elements.map((ae) => (
                <Tooltip key={ae.id} title={ae.name}>
                  <Tag color="purple" style={{ fontSize: 11 }}>{ae.id}</Tag>
                </Tooltip>
              ))}
            </Space>
          )}
        </Col>

        {/* Verification Measures */}
        <Col span={7}>
          {row.verification_measures.length === 0 ? (
            <Tag color="warning">None</Tag>
          ) : (
            <Space wrap size={2}>
              {row.verification_measures.map((vm) => (
                <Tooltip key={vm.id} title={`${vm.title} (${vm.technique})`}>
                  <Tag color="cyan" style={{ fontSize: 11 }}>{vm.id}</Tag>
                </Tooltip>
              ))}
            </Space>
          )}
        </Col>

        {/* Results */}
        <Col span={4}>
          {row.verification_results.length === 0 ? (
            <Tag>No Results</Tag>
          ) : (
            <Space wrap size={2}>
              {row.verification_results.map((vr) => (
                <Tag
                  key={vr.id}
                  color={vr.result === "pass" ? "success" : vr.result === "fail" ? "error" : "default"}
                  style={{ fontSize: 11 }}
                >
                  {vr.result}
                </Tag>
              ))}
            </Space>
          )}
        </Col>

        {/* Fully traced */}
        <Col span={2} style={{ textAlign: "center" }}>
          {row.is_fully_traced ? (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          ) : (
            <WarningOutlined style={{ color: "#faad14" }} />
          )}
        </Col>
      </Row>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────
export default function TraceabilityMatrixView({ projectId }) {
  const {
    matrix,
    coverage,
    gaps,
    loading,
    matrixLoading,
    loadMatrix,
    loadCoverage,
    loadGaps,
  } = useTraceability(projectId);

  useEffect(() => {
    loadMatrix();
    loadCoverage();
    loadGaps();
  }, [loadMatrix, loadCoverage, loadGaps]);

  const handleRefresh = () => {
    loadMatrix();
    loadCoverage();
    loadGaps();
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <Space style={{ marginBottom: 16 }}>
        <Title level={5} style={{ margin: 0 }}>Traceability Matrix</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={matrixLoading}
          size="small"
        >
          Refresh
        </Button>
      </Space>

      {/* Coverage Cards */}
      {coverage && (
        <Row gutter={12} style={{ marginBottom: 16 }}>
          {Object.entries(coverage).map(([entityType, data]) => (
            <Col key={entityType} span={6}>
              <CoverageCard entityType={entityType} data={data} />
            </Col>
          ))}
        </Row>
      )}

      {/* Summary */}
      {matrix?.summary && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Requirements"
                value={matrix.summary.total_requirements}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Fully Traced"
                value={matrix.summary.fully_traced}
                valueStyle={{ color: "#52c41a" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Partially Traced"
                value={matrix.summary.partially_traced}
                valueStyle={{ color: "#faad14" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Traceability"
                value={`${matrix.summary.traceability_percent}%`}
                valueStyle={{ color: matrix.summary.traceability_percent >= 80 ? "#52c41a" : "#faad14" }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Gaps Panel */}
      {gaps.length > 0 && (
        <Alert
          type="warning"
          style={{ marginBottom: 12 }}
          message={`${gaps.length} traceability gap(s) detected`}
          description={
            <Collapse ghost size="small">
              <Collapse.Panel header="View gaps" key="1">
                <List
                  size="small"
                  dataSource={gaps}
                  renderItem={(gap) => (
                    <List.Item>
                      <Space>
                        <Text code>{gap.entity_id}</Text>
                        <Tag>{gap.entity_type}</Tag>
                        <Text type="secondary">{gap.missing}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </Collapse.Panel>
            </Collapse>
          }
        />
      )}

      {/* Matrix Header */}
      <div style={{ background: "#fafafa", padding: "8px 0", borderBottom: "2px solid #d9d9d9", marginBottom: 4 }}>
        <Row gutter={8}>
          <Col span={6}><Text strong>Requirement</Text></Col>
          <Col span={5}><Text strong>Architecture (SYS.3)</Text></Col>
          <Col span={7}><Text strong>Verification Measures (SYS.4/5)</Text></Col>
          <Col span={4}><Text strong>Results</Text></Col>
          <Col span={2} style={{ textAlign: "center" }}><Text strong>OK</Text></Col>
        </Row>
      </div>

      {/* Matrix Rows */}
      <Spin spinning={matrixLoading}>
        {matrix?.matrix?.length === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
            No requirements yet. Add requirements in the Requirements tab.
          </div>
        )}
        {(matrix?.matrix || []).map((row) => (
          <MatrixRow key={row.requirement.id} row={row} />
        ))}
      </Spin>
    </div>
  );
}
