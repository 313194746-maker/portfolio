const App = () => (
  <>
    <Hero />
    <Capabilities />
  </>
);

window.App = App;

const root = ReactDOM.createRoot(document.querySelector("#root"));
root.render(<App />);
