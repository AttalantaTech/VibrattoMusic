import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "../ChatInput";

describe("ChatInput", () => {
	let onSendMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onSendMock = vi.fn();
	});

	it("should render the chat input with placeholder", () => {
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		expect(textarea).toBeInTheDocument();
	});

	it("should render send button", () => {
		render(<ChatInput onSend={onSendMock} />);
		
		const sendButton = screen.getByLabelText("Enviar mensagem");
		expect(sendButton).toBeInTheDocument();
	});

	it("should disable send button when input is empty", () => {
		render(<ChatInput onSend={onSendMock} />);
		
		const sendButton = screen.getByLabelText("Enviar mensagem");
		expect(sendButton).toBeDisabled();
	});

	it("should enable send button when input has text", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		const sendButton = screen.getByLabelText("Enviar mensagem");
		
		await user.type(textarea, "Hello");
		expect(sendButton).not.toBeDisabled();
	});

	it("should call onSend when send button is clicked", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		const sendButton = screen.getByLabelText("Enviar mensagem");
		
		await user.type(textarea, "Test message");
		await user.click(sendButton);
		
		expect(onSendMock).toHaveBeenCalledWith("Test message");
		expect(onSendMock).toHaveBeenCalledTimes(1);
	});

	it("should clear input after sending message", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		const sendButton = screen.getByLabelText("Enviar mensagem");
		
		await user.type(textarea, "Test message");
		await user.click(sendButton);
		
		expect((textarea as HTMLTextAreaElement).value).toBe("");
	});

	it("should send message on Enter key press", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		
		await user.type(textarea, "Test message");
		await user.keyboard("{Enter}");
		
		expect(onSendMock).toHaveBeenCalledWith("Test message");
	});

	it("should not send message on Shift+Enter", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		
		await user.type(textarea, "Test message");
		await user.keyboard("{Shift>}{Enter}{/Shift}");
		
		expect(onSendMock).not.toHaveBeenCalled();
	});

	it("should not send empty or whitespace-only messages", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		const sendButton = screen.getByLabelText("Enviar mensagem");
		
		// Try to send empty message
		await user.click(sendButton);
		expect(onSendMock).not.toHaveBeenCalled();
		
		// Try to send whitespace-only message
		await user.type(textarea, "   ");
		await user.click(sendButton);
		expect(onSendMock).not.toHaveBeenCalled();
	});

	it("should respect disabled prop", () => {
		render(<ChatInput onSend={onSendMock} disabled />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		const sendButton = screen.getByLabelText("Enviar mensagem");
		
		expect(textarea).toBeDisabled();
		expect(sendButton).toBeDisabled();
	});

	it("should use custom placeholder when provided", () => {
		render(<ChatInput onSend={onSendMock} placeholder="Custom placeholder" />);
		
		const textarea = screen.getByPlaceholderText("Custom placeholder");
		expect(textarea).toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const { container } = render(<ChatInput onSend={onSendMock} className="custom-class" />);
		
		const wrapper = container.firstChild;
		expect(wrapper).toHaveClass("custom-class");
	});

	it("should handle rapid multiple sends correctly", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSend={onSendMock} />);
		
		const textarea = screen.getByPlaceholderText("Digite sua mensagem...");
		const sendButton = screen.getByLabelText("Enviar mensagem");
		
		// Send first message
		await user.type(textarea, "First message");
		await user.click(sendButton);
		
		// Send second message
		await user.type(textarea, "Second message");
		await user.click(sendButton);
		
		expect(onSendMock).toHaveBeenCalledTimes(2);
		expect(onSendMock).toHaveBeenNthCalledWith(1, "First message");
		expect(onSendMock).toHaveBeenNthCalledWith(2, "Second message");
	});

	it("should not have file upload button", () => {
		render(<ChatInput onSend={onSendMock} />);
		
		// Should not find attachment button
		const attachButton = screen.queryByLabelText("Anexar arquivo");
		expect(attachButton).not.toBeInTheDocument();
	});

	it("should not have audio recording button", () => {
		render(<ChatInput onSend={onSendMock} />);
		
		// Should not find microphone button
		const micButton = screen.queryByLabelText(/gravar/i);
		expect(micButton).not.toBeInTheDocument();
	});
});