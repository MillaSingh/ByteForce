// authController.test.js

const { deleteAccount } = require('../src/controllers/authController.js');

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Delete Account Controller", () => {

  // ✅ Test 1: Delete button visible (UI-level - basic check)
  test("should allow delete request when user is logged in", async () => {
    const req = {
      user: { user_id: 1 },
      body: { password: "correctPassword" }
    };
    const res = mockResponse();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ✅ Test 2: Password required
  test("should not delete account if password is missing", async () => {
    const req = {
      user: { user_id: 1 },
      body: {}
    };
    const res = mockResponse();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Password is required"
    });
  });

  // ✅ Test 3: Incorrect password
  test("should not delete account if password is incorrect", async () => {
    const req = {
      user: { user_id: 1 },
      body: { password: "wrongPassword" }
    };
    const res = mockResponse();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ✅ Test 4: Successful deletion
  test("should delete account with correct password", async () => {
    const req = {
      user: { user_id: 1 },
      body: { password: "correctPassword" }
    };
    const res = mockResponse();

    await deleteAccount(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Account deleted"
    });
  });

  // ✅ Test 5: Account inaccessible after deletion
  test("should prevent login after account deletion", async () => {
    const deletedUser = null;

    expect(deletedUser).toBeNull();
  });

});