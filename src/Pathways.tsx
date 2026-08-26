import { BackgroundLayer, type Background } from './Canvas';
import { PathwayCards } from './PathwayCards';

interface PathwaysProps {
  background: Background;
  onOpen: (groupId: string) => void;
}

/** The Pathways tab: every sequence, for people who land here without seeing the front page. */
export function Pathways({ background, onOpen }: PathwaysProps) {
  return (
    <main className="pathways-page">
      <BackgroundLayer background={background} />
      <div className="pathways-inner">
        <p className="pathways-intro">
          A pathway is a route through the map, in order.
        </p>
        <PathwayCards onOpen={onOpen} />
      </div>
    </main>
  );
}
