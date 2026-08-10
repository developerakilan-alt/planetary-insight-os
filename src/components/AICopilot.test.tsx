import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnswerBody } from "@/components/AICopilot";

describe("AnswerBody", () => {
  it("renders plain paragraphs", () => {
    render(<AnswerBody text={"First line.\nSecond line."} />);
    expect(screen.getByText("First line.")).toBeInTheDocument();
    expect(screen.getByText("Second line.")).toBeInTheDocument();
  });

  it("turns bullet lines into list rows", () => {
    render(<AnswerBody text={"- First point\n• Second point\n* Third point"} />);
    expect(screen.getByText("First point")).toBeInTheDocument();
    expect(screen.getByText("Second point")).toBeInTheDocument();
    expect(screen.getByText("Third point")).toBeInTheDocument();
  });

  it("renders headings as label rows", () => {
    render(<AnswerBody text={"## Engineering assessment\nSome detail."} />);
    expect(screen.getByText("Engineering assessment")).toBeInTheDocument();
    expect(screen.getByText("Some detail.")).toBeInTheDocument();
  });

  it("strips bold markers while keeping the content", () => {
    render(<AnswerBody text={"This is **critical** to the landing."} />);
    expect(screen.getByText("This is critical to the landing.")).toBeInTheDocument();
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it("ignores empty lines", () => {
    render(<AnswerBody text={"A\n\n\nB"} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
