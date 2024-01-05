import { cookies } from "next/headers";
import { apiHandler } from "../../../_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: logout,
});

function logout() {
  cookies().delete("authorization");
  cookies().delete("userId");
  cookies().delete("username");
  cookies().delete("profile-img");
}
