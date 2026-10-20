// What each kind of recorded position means. Shown on the bill pages.
export default function PositionGuide({ headingLevel = 2 }) {
  const H = `h${headingLevel}`
  return (
    <section className="bench__how" aria-labelledby="how-h">
      <H id="how-h">How to read a candidate's position</H>
      <dl>
        <dt>Voted yes</dt><dd>Voted to pass the bill.</dd>
        <dt>Voted no</dt><dd>Voted against passing it. Legislators vote no for different reasons, so check their statements too.</dd>
        <dt>Did not vote</dt><dd>Was in office but has no recorded vote, for example because they were absent or abstained.</dd>
        <dt>Author, co-author, sponsor</dt><dd>Wrote or formally backed the bill.</dd>
        <dt>Signed</dt><dd>Put their name on the letter.</dd>
      </dl>
    </section>
  )
}
