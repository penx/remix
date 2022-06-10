import { LoaderFunction } from "@remix-run/node";
import { requireAuth } from "~/server/auth.server";
import { subscribe, eventStream } from "../server/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  console.warn("events loader");
  const { uid } = await requireAuth(request);
  return eventStream(request, (send) => {
    console.warn("subscribing");
    const unsubscribe = subscribe(uid, (todo) => {
      console.warn("sending", todo);
      send("message", JSON.stringify(todo));
    });
    return () => {
      console.warn("unsubscribing");
      unsubscribe();
    };
  });
};
