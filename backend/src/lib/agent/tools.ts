import type { ToolDefinition, ToolCall, ToolResult } from "./types.js";

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "search_documents",
    description:
      "Search across documents in a project or the user's document library. " +
      "Returns matching text excerpts with document names and page numbers.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find relevant document passages",
        },
        project_id: {
          type: "string",
          description: "Optional project ID to scope the search to",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "read_document",
    description:
      "Read the full text content of a specific document by its ID. " +
      "Use this when you need to review an entire document in detail.",
    parameters: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "The ID of the document to read",
        },
      },
      required: ["document_id"],
    },
  },
  {
    name: "create_document",
    description:
      "Create a new document with the given content. " +
      "Supports Markdown content that will be converted to the requested format.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The document title/filename",
        },
        content: {
          type: "string",
          description: "The document content in Markdown format",
        },
        project_id: {
          type: "string",
          description: "Optional project ID to add the document to",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "edit_document",
    description:
      "Make tracked-changes edits to an existing document. " +
      "Specify the original text to find and the replacement text. " +
      "Multiple edits can be batched in a single call.",
    parameters: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "The ID of the document to edit",
        },
        edits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              find: {
                type: "string",
                description: "The exact text to find in the document",
              },
              replace: {
                type: "string",
                description: "The replacement text",
              },
              reason: {
                type: "string",
                description: "Brief reason for this edit",
              },
            },
            required: ["find", "replace"],
          },
          description: "Array of find-and-replace edits to apply",
        },
      },
      required: ["document_id", "edits"],
    },
  },
  {
    name: "extract_table",
    description:
      "Extract structured tabular data from one or more documents. " +
      "Specify the columns you want extracted and the documents to process.",
    parameters: {
      type: "object",
      properties: {
        document_ids: {
          type: "array",
          items: { type: "string" },
          description: "IDs of documents to extract data from",
        },
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Column header name",
              },
              description: {
                type: "string",
                description: "What data to extract for this column",
              },
            },
            required: ["name", "description"],
          },
          description: "Column definitions for the extraction",
        },
      },
      required: ["document_ids", "columns"],
    },
  },
  {
    name: "list_documents",
    description:
      "List documents available in a project or the user's document library.",
    parameters: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Optional project ID to list documents from",
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return (default 20)",
        },
      },
    },
  },
  {
    name: "summarize_document",
    description:
      "Generate a concise summary of a document, highlighting key terms, " +
      "parties, obligations, dates, and important clauses.",
    parameters: {
      type: "object",
      properties: {
        document_id: {
          type: "string",
          description: "The ID of the document to summarize",
        },
        focus: {
          type: "string",
          description:
            "Optional focus area for the summary (e.g., 'payment terms', 'indemnification')",
        },
      },
      required: ["document_id"],
    },
  },
  {
    name: "compare_documents",
    description:
      "Compare two documents and identify key differences in terms, " +
      "clauses, and obligations.",
    parameters: {
      type: "object",
      properties: {
        document_id_a: {
          type: "string",
          description: "ID of the first document",
        },
        document_id_b: {
          type: "string",
          description: "ID of the second document",
        },
        focus: {
          type: "string",
          description: "Optional focus area for the comparison",
        },
      },
      required: ["document_id_a", "document_id_b"],
    },
  },
];

export async function executeTool(
  toolCall: ToolCall,
  _context: { userId: string; projectId?: string },
): Promise<ToolResult> {
  try {
    const result = await dispatchTool(toolCall);
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      content: typeof result === "string" ? result : JSON.stringify(result),
    };
  } catch (err) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      content: `Error executing ${toolCall.name}: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}

async function dispatchTool(
  toolCall: ToolCall,
): Promise<unknown> {
  switch (toolCall.name) {
    case "search_documents":
      return mockSearchDocuments(toolCall.arguments);
    case "read_document":
      return mockReadDocument(toolCall.arguments);
    case "create_document":
      return mockCreateDocument(toolCall.arguments);
    case "edit_document":
      return mockEditDocument(toolCall.arguments);
    case "extract_table":
      return mockExtractTable(toolCall.arguments);
    case "list_documents":
      return mockListDocuments(toolCall.arguments);
    case "summarize_document":
      return mockSummarizeDocument(toolCall.arguments);
    case "compare_documents":
      return mockCompareDocuments(toolCall.arguments);
    default:
      throw new Error(`Unknown tool: ${toolCall.name}`);
  }
}

/*
 * Mock implementations for demonstration purposes.
 * In production these would query Supabase and S3 for real document data.
 * The agent loop and tool-use protocol work identically with real or mock data.
 */

function mockSearchDocuments(args: Record<string, unknown>) {
  return {
    results: [
      {
        documentId: "doc-001",
        filename: "Service_Agreement_2024.pdf",
        excerpt: `Relevant passage matching "${args.query}"...`,
        page: 3,
        score: 0.92,
      },
      {
        documentId: "doc-002",
        filename: "NDA_Counterparty.pdf",
        excerpt: `Another match for "${args.query}"...`,
        page: 1,
        score: 0.85,
      },
    ],
    totalResults: 2,
  };
}

function mockReadDocument(args: Record<string, unknown>) {
  return {
    documentId: args.document_id,
    filename: "Service_Agreement_2024.pdf",
    content:
      "MASTER SERVICE AGREEMENT\n\n" +
      "This Master Service Agreement (the 'Agreement') is entered into as of January 1, 2024, " +
      "by and between Acme Corp ('Client') and TechCo Inc ('Service Provider').\n\n" +
      "1. SERVICES. Service Provider shall provide the services described in each Statement " +
      "of Work ('SOW') executed under this Agreement.\n\n" +
      "2. TERM. This Agreement shall commence on the Effective Date and continue for a period " +
      "of twelve (12) months, unless earlier terminated.\n\n" +
      "3. FEES. Client shall pay Service Provider the fees set forth in each SOW. " +
      "Payment terms are Net 30 from invoice date.\n\n" +
      "4. CONFIDENTIALITY. Each party agrees to maintain the confidentiality of the other " +
      "party's Confidential Information.\n\n" +
      "5. LIMITATION OF LIABILITY. In no event shall either party's aggregate liability " +
      "exceed the total fees paid in the twelve (12) months preceding the claim.",
    pageCount: 8,
  };
}

function mockCreateDocument(args: Record<string, unknown>) {
  return {
    documentId: `doc-${Date.now()}`,
    filename: args.title,
    status: "created",
    message: `Document "${args.title}" created successfully`,
  };
}

function mockEditDocument(args: Record<string, unknown>) {
  const edits = args.edits as Array<{ find: string; replace: string }>;
  return {
    documentId: args.document_id,
    appliedEdits: edits.length,
    status: "pending_review",
    message: `${edits.length} tracked change(s) applied. Awaiting user review.`,
  };
}

function mockExtractTable(args: Record<string, unknown>) {
  const docIds = args.document_ids as string[];
  const columns = args.columns as Array<{ name: string }>;
  return {
    columns: columns.map((c) => c.name),
    rows: docIds.map((id) => ({
      documentId: id,
      cells: columns.map((c) => ({
        column: c.name,
        value: `[Extracted ${c.name} from ${id}]`,
      })),
    })),
  };
}

function mockListDocuments(_args: Record<string, unknown>) {
  return {
    documents: [
      {
        id: "doc-001",
        filename: "Service_Agreement_2024.pdf",
        type: "pdf",
        pages: 8,
        uploadedAt: "2024-11-15T10:00:00Z",
      },
      {
        id: "doc-002",
        filename: "NDA_Counterparty.pdf",
        type: "pdf",
        pages: 4,
        uploadedAt: "2024-11-14T15:30:00Z",
      },
      {
        id: "doc-003",
        filename: "Employment_Contract_Template.docx",
        type: "docx",
        pages: 12,
        uploadedAt: "2024-11-10T09:00:00Z",
      },
    ],
    total: 3,
  };
}

function mockSummarizeDocument(args: Record<string, unknown>) {
  return {
    documentId: args.document_id,
    summary:
      "This is a Master Service Agreement between Acme Corp (Client) and TechCo Inc " +
      "(Service Provider) dated January 1, 2024. Key terms: 12-month term, Net 30 " +
      "payment, mutual confidentiality obligations, liability capped at 12 months of fees.",
    keyTerms: [
      { term: "Term", value: "12 months" },
      { term: "Payment", value: "Net 30" },
      { term: "Liability Cap", value: "12 months of fees" },
    ],
    parties: ["Acme Corp (Client)", "TechCo Inc (Service Provider)"],
  };
}

function mockCompareDocuments(args: Record<string, unknown>) {
  return {
    documentA: args.document_id_a,
    documentB: args.document_id_b,
    differences: [
      {
        clause: "Payment Terms",
        docA: "Net 30",
        docB: "Net 45",
        significance: "high",
      },
      {
        clause: "Liability Cap",
        docA: "12 months of fees",
        docB: "Unlimited",
        significance: "critical",
      },
    ],
    similaritiesCount: 8,
    differencesCount: 2,
  };
}
