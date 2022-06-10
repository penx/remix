import { EventEmitter } from "events";
import type {
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";

// helper function to convert firestore data to typescript
const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
});

// helper to apply converter to multiple collections
const dataPoint = <T>(collectionPath: string) =>
  getFirestore().collection(collectionPath).withConverter(converter<T>());

export type Todo = {
  id: string;
  title: string;
};

const db = {
  userTodos: (uid: string) => dataPoint<Todo>(`users/${uid}/todos`),
};

export const getUserTodos = async (uid: string): Promise<Todo[]> => {
  const todoSnap = await db.userTodos(uid).get();
  const todoData = todoSnap.docs.map((doc) => doc.data());
  return todoData;
};

export const addTodo = async (uid: string, title: string) => {
  const newTodoRef = db.userTodos(uid).doc();
  await newTodoRef.set({ title, id: newTodoRef.id });
};

export const removeTodo = async (uid: string, todoId: string) => {
  await db.userTodos(uid).doc(todoId).delete();
};

export function eventStream(
  request: Request,
  init: (send: (event: string, data: string) => void) => () => void
) {
  let stream = new ReadableStream({
    start(controller) {
      let encoder = new TextEncoder();
      let send = (event: string, data: string) => {
        console.warn("enqueue");
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };
      let cleanup = init(send);
      let closed = false;
      let close = () => {
        if (closed) return;
        cleanup();
        closed = true;
        request.signal.removeEventListener("abort", close);
        controller.close();
      };
      request.signal.addEventListener("abort", close);
      if (request.signal.aborted) {
        close();
        return;
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

export const subscribe = (
  userId: string,
  callback: (snapshot: QuerySnapshot<Todo>) => void
) => db.userTodos(userId).onSnapshot(callback);
