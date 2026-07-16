// PurchaseOrderPrintView.jsx - Completely stripped down version
import React from "react";

export default function PurchaseOrderPrintView({ po, formatDate, formatCurrency }) {
  if (!po) return null;

  const companyDetails = {
    name: "YOUR COMPANY NAME",
    address: "123 Business Street, City, State - 123456",
    phone: "+91 98765 43210",
    email: "info@yourcompany.com",
    website: "www.yourcompany.com",
    gst: "GSTIN: 22AAAAA0000A1Z5",
    pan: "PAN: AAAAA0000A",
  };

  const getStatusText = (status) => {
    const statusMap = {
      DRAFT: "Draft",
      PENDING: "Pending Approval",
      SUBMITTED: "Submitted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      PARTIAL: "Partially Received",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      IN_PROGRESS: "In Progress",
    };
    return statusMap[status] || status || "N/A";
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: { bg: "#F3F4F6", text: "#6B7280" },
      PENDING: { bg: "#FEF3C7", text: "#92400E" },
      SUBMITTED: { bg: "#DBEAFE", text: "#1E40AF" },
      APPROVED: { bg: "#D1FAE5", text: "#065F46" },
      REJECTED: { bg: "#FEE2E2", text: "#991B1B" },
      PARTIAL: { bg: "#FFEDD5", text: "#9A3412" },
      COMPLETED: { bg: "#EDE9FE", text: "#5B21B6" },
      CANCELLED: { bg: "#FEE2E2", text: "#991B1B" },
      IN_PROGRESS: { bg: "#E0E7FF", text: "#3730A3" },
    };
    return colors[status] || colors.DRAFT;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    po.lines?.forEach(line => {
      subtotal += line.quantity * line.unitPrice;
    });
    return {
      subtotal,
      discount: po.discountAmount || 0,
      shipping: po.shippingCharges || 0,
      gst: po.totalGst || 0,
      grandTotal: po.grandTotal || subtotal
    };
  };

  const totals = calculateTotals();

  const formatNumber = (num) => {
    if (!num) return "0.00";
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Use plain inline styles - no classes, no gradients
  return (
    <div style={{
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      maxWidth: "210mm",
      margin: "0 auto",
      padding: "20px",
      backgroundColor: "#ffffff",
      color: "#333333",
      fontSize: "11px",
      lineHeight: "1.5",
    }}>
      {/* Document */}
      <div style={{
        border: "1px solid #ddd",
        padding: "25px",
        backgroundColor: "#ffffff",
        position: "relative",
      }}>
        {/* Draft Watermark */}
        {/* {po.status === "DRAFT" && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: "70px",
            fontWeight: "bold",
            color: "rgba(255, 0, 0, 0.08)",
            letterSpacing: "15px",
            pointerEvents: "none",
            zIndex: 0,
          }}>
            DRAFT
          </div>
        )} */}

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "3px solid #2563EB",
          paddingBottom: "15px",
          marginBottom: "15px",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1F2937" }}>
              {companyDetails.name}
            </div>
            <div style={{ fontSize: "9px", color: "#6B7280", marginTop: "3px" }}>
              <div>{companyDetails.address}</div>
              <div style={{ marginTop: "2px" }}>
                <span>📞 {companyDetails.phone}</span>
                <span style={{ marginLeft: "12px" }}>✉️ {companyDetails.email}</span>
                <span style={{ marginLeft: "12px" }}>🌐 {companyDetails.website}</span>
              </div>
              <div style={{ marginTop: "2px" }}>
                <span>{companyDetails.gst}</span>
                <span style={{ marginLeft: "12px" }}>{companyDetails.pan}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right", minWidth: "200px" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#2563EB", textTransform: "uppercase" }}>
              Purchase Order
            </div>
            <div style={{ marginTop: "5px", fontSize: "11px" }}>
              <div><strong>PO Number:</strong> <span style={{ color: "#2563EB" }}>{po.poNumber}</span></div>
              <div><strong>PO Date:</strong> {formatDate(po.poDate)}</div>
              <div><strong>Status:</strong> 
                <span style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  backgroundColor: getStatusBadge(po.status).bg,
                  color: getStatusBadge(po.status).text,
                  marginLeft: "4px",
                }}>
                  {getStatusText(po.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SUPPLIER & DELIVERY INFO */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "15px",
          position: "relative",
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#374151", textTransform: "uppercase", marginBottom: "5px" }}>
              Supplier Information
            </div>
            <div style={{ fontSize: "10.5px" }}>
              <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "3px" }}>
                {po.supplierName}
              </div>
              {po.supplierAddress && <div style={{ color: "#4B5563" }}>{po.supplierAddress}</div>}
              {po.supplierEmail && <div style={{ color: "#4B5563" }}><strong>Email:</strong> {po.supplierEmail}</div>}
              {po.supplierPhone && <div style={{ color: "#4B5563" }}><strong>Phone:</strong> {po.supplierPhone}</div>}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#374151", textTransform: "uppercase", marginBottom: "5px" }}>
              Delivery Information
            </div>
            <div style={{ fontSize: "10.5px" }}>
              <div><strong>Expected Delivery:</strong> {formatDate(po.expectedArrivalDate)}</div>
              {po.shippingAddress && (
                <div style={{ color: "#4B5563", marginTop: "3px" }}>
                  <strong>Shipping Address:</strong>
                  <div>{po.shippingAddress}</div>
                </div>
              )}
              {po.purchaseRequestNumber && (
                <div style={{ marginTop: "3px" }}>
                  <strong>PR Reference:</strong> PR-{po.purchaseRequestNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ORDER ITEMS TABLE */}
        <div style={{ marginBottom: "15px", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", color: "#374151", textTransform: "uppercase", marginBottom: "5px" }}>
            Order Items
          </div>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "10px",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#F3F4F6" }}>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>#</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "left", fontWeight: "bold" }}>Item Code</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "left", fontWeight: "bold" }}>Description</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>UOM</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>Qty</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>Unit Price (₹)</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {po.lines?.map((line, index) => (
                <tr key={line.id || index}>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px" }}>{line.itemCode || "-"}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px" }}>
                    <div>{line.itemName}</div>
                    {line.itemDescription && (
                      <div style={{ fontSize: "9px", color: "#6B7280" }}>{line.itemDescription}</div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px", textAlign: "center" }}>{line.uom || "Nos"}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px", textAlign: "right" }}>{line.quantity}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px", textAlign: "right" }}>{formatCurrency(line.unitPrice)}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "5px 8px", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" style={{ border: "none" }}></td>
                <td style={{ border: "1px solid #D1D5DB", textAlign: "right", fontWeight: "bold" }}>Subtotal</td>
                <td style={{ border: "1px solid #D1D5DB", textAlign: "right" }}>₹{formatNumber(totals.subtotal)}</td>
              </tr>
              {totals.discount > 0 && (
                <tr>
                  <td colSpan="5" style={{ border: "none" }}></td>
                  <td style={{ border: "1px solid #D1D5DB", textAlign: "right", color: "#DC2626" }}>Discount</td>
                  <td style={{ border: "1px solid #D1D5DB", textAlign: "right", color: "#DC2626" }}>-₹{formatNumber(totals.discount)}</td>
                </tr>
              )}
              {totals.shipping > 0 && (
                <tr>
                  <td colSpan="5" style={{ border: "none" }}></td>
                  <td style={{ border: "1px solid #D1D5DB", textAlign: "right" }}>Shipping</td>
                  <td style={{ border: "1px solid #D1D5DB", textAlign: "right" }}>₹{formatNumber(totals.shipping)}</td>
                </tr>
              )}
              {totals.gst > 0 && (
                <tr>
                  <td colSpan="5" style={{ border: "none" }}></td>
                  <td style={{ border: "1px solid #D1D5DB", textAlign: "right" }}>GST</td>
                  <td style={{ border: "1px solid #D1D5DB", textAlign: "right" }}>₹{formatNumber(totals.gst)}</td>
                </tr>
              )}
              <tr style={{ backgroundColor: "#EFF6FF", fontWeight: "bold", borderTop: "2px solid #2563EB" }}>
                <td colSpan="5" style={{ border: "1px solid #D1D5DB" }}></td>
                <td style={{ border: "1px solid #D1D5DB", textAlign: "right", fontSize: "12px" }}>GRAND TOTAL</td>
                <td style={{ border: "1px solid #D1D5DB", textAlign: "right", fontSize: "13px", color: "#2563EB" }}>
                  ₹{formatNumber(totals.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* TERMS & REMARKS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
          marginBottom: "15px",
          position: "relative",
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#374151", textTransform: "uppercase" }}>
              Payment Terms
            </div>
            <p style={{ fontSize: "10px", color: "#4B5563", margin: "2px 0 0 0" }}>
              {po.paymentTerms || "Net 30 days from invoice date"}
            </p>
          </div>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#374151", textTransform: "uppercase" }}>
              Delivery Mode
            </div>
            <p style={{ fontSize: "10px", color: "#4B5563", margin: "2px 0 0 0" }}>
              {po.deliveryMode || "Standard Delivery"}
            </p>
          </div>
        </div>

        {po.remarks && (
          <div style={{
            marginBottom: "15px",
            padding: "8px 12px",
            backgroundColor: "#F9FAFB",
            borderLeft: "3px solid #2563EB",
            position: "relative",
            zIndex: 1,
          }}>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#374151", marginBottom: "2px" }}>
              Remarks / Special Instructions
            </div>
            <p style={{ fontSize: "10px", color: "#4B5563", margin: "0" }}>{po.remarks}</p>
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          borderTop: "1px solid #E5E7EB",
          paddingTop: "15px",
          marginTop: "5px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          position: "relative",
          zIndex: 1,
        }}>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#374151", marginBottom: "2px" }}>
              Authorized Signatory
            </div>
            <div style={{ borderTop: "1px solid #9CA3AF", marginTop: "20px", paddingTop: "4px", minWidth: "180px" }}>
              (Signature)
            </div>
            <div style={{ fontSize: "10px", marginTop: "2px" }}>Name: ____________________</div>
            <div style={{ fontSize: "10px" }}>Date: {currentDate}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", color: "#6B7280" }}>This is a computer-generated document.</div>
            <div style={{ fontSize: "9px", color: "#6B7280" }}>{companyDetails.gst} | {companyDetails.pan}</div>
            <div style={{ fontSize: "9px", color: "#2563EB", marginTop: "3px", fontWeight: "bold" }}>
              Thank you for your business!
            </div>
          </div>
        </div>

        {/* TERMS & CONDITIONS */}
        <div style={{
          marginTop: "10px",
          padding: "6px 10px",
          backgroundColor: "#F9FAFB",
          fontSize: "8.5px",
          color: "#4B5563",
          border: "1px solid #E5E7EB",
          position: "relative",
          zIndex: 1,
        }}>
          <strong style={{ fontSize: "9px", display: "block", marginBottom: "2px", color: "#374151" }}>
            Terms & Conditions:
          </strong>
          <ol style={{ margin: "0", paddingLeft: "16px", columns: "2", columnGap: "20px" }}>
            <li>Goods subject to inspection and approval upon delivery.</li>
            <li>Discrepancies must be reported within 7 days.</li>
            <li>Payment terms as agreed upon.</li>
            <li>PO valid for 30 days from issue date.</li>
          </ol>
        </div>

        <div style={{
          fontSize: "8px",
          color: "#6B7280",
          textAlign: "center",
          marginTop: "10px",
        }}>
          {companyDetails.name} • {companyDetails.address} • {companyDetails.phone} • {companyDetails.email}
          <br />
          PO: {po.poNumber} • Generated on: {currentDate} • Page 1 of 1
        </div>
      </div>
    </div>
  );
}