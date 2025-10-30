module.exports = {
	roots: ["<rootDir>/shared"],
	testMatch: ["**/__tests__/**/*.test.js"],
	transform: {},
	testEnvironment: "node",
	collectCoverageFrom: ["shared/**/*.js", "!shared/**/__tests__/**"],
};


