/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify({ email: "test@example.com" })),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;
    });

    test("Then handleChangeFile should validate the file extension", async () => {
      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "mockFileUrl",
            key: "mockKey",
          }),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const fileInput = screen.getByTestId("file");
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      fileInput.addEventListener("change", handleChangeFile);

      const file = new File(["dummy content"], "test-image.png", {
        type: "image/png",
      });

      Object.defineProperty(fileInput, "files", {
        value: [file],
        writable: true,
      });

      fireEvent.change(fileInput);
      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Then handleSubmit should call updateBill and navigate to Bills page", () => {
      const onNavigate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          update: jest.fn().mockResolvedValue({}),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
    });

    describe("When I submit a new bill", () => {
      test("Then it should make a POST request and navigate to Bills page", async () => {
        const onNavigate = jest.fn();
        const store = {
          bills: jest.fn(() => ({
            update: jest.fn().mockResolvedValue({}),
          })),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        newBill.fileUrl = "http://localhost/file.png";
        newBill.fileName = "file.png";

        const form = screen.getByTestId("form-new-bill");
        fireEvent.submit(form);

        expect(store.bills).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledWith("#employee/bills");
      });

      test("Then it should handle 404 and 500 errors gracefully", async () => {
        const onNavigate = jest.fn();
        const updateMock = jest
          .fn()
          .mockRejectedValueOnce({ response: { status: 404 } }) // Simule une erreur 404
          .mockRejectedValueOnce({ response: { status: 500 } }); // Simule une erreur 500
        const store = {
          bills: jest.fn(() => ({
            update: updateMock,
          })),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        const form = screen.getByTestId("form-new-bill");

        // Mock console.error pour capturer les erreurs
        console.error = jest.fn();

        // Test pour l'erreur 404
        fireEvent.submit(form);
        await new Promise((r) => setTimeout(r, 0)); // Attendre l'exécution des promesses
        expect(updateMock).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith({ response: { status: 404 } });

        // Test pour l'erreur 500
        fireEvent.submit(form);
        await new Promise((r) => setTimeout(r, 0)); // Attendre l'exécution des promesses
        expect(updateMock).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith({ response: { status: 500 } });
      });
    });
  });
});
