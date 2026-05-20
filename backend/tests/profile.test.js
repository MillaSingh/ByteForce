const fs = require("fs");
const path = require("path");

describe("Profile page navigation code", () => {
  let profileJs;

  beforeAll(() => {
    const profilePath = path.join(
      __dirname,
      "../../frontend/js/profile.js"
    );

    profileJs = fs.readFileSync(profilePath, "utf8");
  });

  test("profile.js contains a back button listener", () => {
    expect(profileJs).toContain("backBtn");
    expect(profileJs).toContain("addEventListener");
    expect(profileJs).toContain("click");
  });

  test("profile back button redirects to account page", () => {
    expect(profileJs).toContain("/html/account.html");
  });

  test("profile page requires authentication", () => {
    expect(profileJs).toContain("requireAuth()");
  });

  test("profile page supports logout", () => {
    expect(profileJs).toContain("logOut");
    expect(profileJs).toContain("logoutBtn");
  });
});