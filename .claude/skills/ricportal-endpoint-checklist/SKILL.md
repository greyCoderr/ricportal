---
name: ricportal-endpoint-checklist
description: Use whenever an API endpoint is added or changed in RICPortal
---
Before finishing an endpoint, verify every item:
1. authenticate and requireRole are present.
2. The request body, params and query are validated with a shared Zod schema.
3. The service applies center scope (BR-02). Another center's row returns 404.
4. Errors use the standard shape with a code from the list in docs/blueprint/03-blueprint.md (4.8).
5. Tests exist for: success, validation error, wrong role (403), wrong center (404),
   not logged in (401), and any state conflict (409 or 422).
6. The route is listed in the permission matrix test.
7. docs/API.md lists the endpoint: role, request, response, error codes.
8. No secrets, password hashes or storage paths appear in any response.
