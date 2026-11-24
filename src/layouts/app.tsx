import { createRouter } from "remix/router";
import { get, route } from "remix/routes";
import { render, run } from "remix/spa";
import AniloxCalculator from "../components/anilox-volume";
import PlateToAniloxCalculator from "../components/plate-anilox";

const routes = route({
  home: get("/"),
});

const router = createRouter({
  middleware: [render()],
  defaultHandler({ render }) {
    return render(<h1>Not Found</h1>, { status: 404 });
  },
});

router.map(routes, {
  actions: {
    home({ render }) {
      return render(
        <>
          <AniloxCalculator />
          <PlateToAniloxCalculator />
        </>
      );
    },
  },
});

run(router, { fallback: <p>Loading…</p> });
