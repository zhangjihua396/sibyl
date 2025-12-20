'use client';

import { useState } from 'react';
import { Button, ColorButton, IconButton, GradientButton } from '@/components/ui/button';
import {
  Card,
  StatCard,
  FeatureCard,
  MetricCard,
  NotificationCard,
} from '@/components/ui/card';
import {
  Spinner,
  LoadingState,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  ProgressSpinner,
} from '@/components/ui/spinner';
import {
  EmptyState,
  ErrorState,
  SuccessState,
  InfoTooltip,
  Hint,
} from '@/components/ui/tooltip';

export default function ShowcasePage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleSuccessDemo = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleProgressDemo = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-sc-bg-dark p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text">
            Sibyl Component Showcase
          </h1>
          <p className="text-sc-fg-muted">
            Electric meets elegant - cyberpunk vibes with delightful micro-interactions
          </p>
        </div>

        {/* Hints Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-sc-fg-primary flex items-center gap-2">
            Hints & Guidance
            <InfoTooltip content="Contextual hints help guide users without overwhelming them" />
          </h2>
          <div className="grid gap-4">
            <Hint variant="tip">
              Pro tip: Hover over interactive elements to see delightful micro-animations
            </Hint>
            <Hint variant="info" dismissible>
              All animations respect the prefers-reduced-motion setting for accessibility
            </Hint>
            <Hint variant="warning" icon="⚡">
              The gradient borders only appear on hover to keep things subtle
            </Hint>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-sc-fg-primary">Interactive Buttons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="primary" spark>
              Primary Spark
            </Button>
            <Button variant="secondary" icon="🚀">
              With Icon
            </Button>
            <Button variant="ghost">
              Ghost Style
            </Button>
            <Button variant="danger">
              Danger Zone
            </Button>
            <ColorButton color="purple" spark>
              Purple
            </ColorButton>
            <ColorButton color="cyan" spark>
              Cyan
            </ColorButton>
            <ColorButton color="coral" spark>
              Coral
            </ColorButton>
            <GradientButton gradient="purple-cyan" spark>
              Gradient Magic
            </GradientButton>
            <Button loading onClick={handleLoadingDemo}>
              Loading State
            </Button>
            <IconButton icon="⚙" label="Settings" />
            <IconButton icon="🔍" label="Search" variant="ghost" />
            <Button disabled>Disabled</Button>
          </div>
        </section>

        {/* Loading States Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-sc-fg-primary">Loading States</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-sc-fg-primary">Default Spinner</h3>
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-sc-fg-primary">Orbital Spinner</h3>
              <div className="flex justify-center">
                <Spinner size="lg" variant="orbital" />
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-sc-fg-primary">Progress</h3>
              <div className="flex justify-center">
                <ProgressSpinner progress={progress} />
              </div>
              <Button onClick={handleProgressDemo} size="sm" className="w-full mt-4">
                Animate Progress
              </Button>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-semibold mb-4 text-sc-fg-primary">Playful Loading Messages</h3>
            {loading ? (
              <LoadingState playful variant="orbital" />
            ) : (
              <div className="text-center py-8">
                <Button onClick={handleLoadingDemo}>
                  Show Loading Messages
                </Button>
              </div>
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-sc-fg-primary">Shimmer Skeleton</h3>
              <SkeletonCard />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-sc-fg-primary">Skeleton List</h3>
              <SkeletonList count={2} />
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-sc-fg-primary">Cards & Metrics</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard
              label="Total Entities"
              value="1,337"
              icon="📊"
              sublabel="+42 this week"
              trend="up"
            />
            <StatCard
              label="Graph Depth"
              value="7"
              icon="🌐"
              sublabel="Average connections"
              trend="neutral"
            />
            <StatCard
              label="Processing"
              value="23"
              icon="⚡"
              sublabel="Items in queue"
              trend="down"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <MetricCard
              label="Storage"
              current={42}
              total={100}
              unit="GB"
              color="purple"
              icon="💾"
            />
            <MetricCard
              label="API Calls"
              current={8432}
              total={10000}
              color="cyan"
              icon="🔌"
            />
            <MetricCard
              label="Success Rate"
              current={98.7}
              unit="%"
              color="green"
              icon="✨"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FeatureCard
              icon="🔍"
              title="Smart Search"
              description="Lightning-fast semantic search across your entire knowledge graph"
              highlight
            />
            <FeatureCard
              icon="🌐"
              title="Visual Explorer"
              description="Interactive 3D visualization of relationships and connections"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card variant="interactive" gradientBorder>
              <h3 className="text-lg font-semibold text-sc-fg-primary mb-2">
                Interactive Card with Gradient Border
              </h3>
              <p className="text-sc-fg-muted text-sm">
                Hover over this card to see the animated gradient border effect
              </p>
            </Card>
            <Card variant="elevated" glow>
              <h3 className="text-lg font-semibold text-sc-fg-primary mb-2">
                Elevated Card with Glow
              </h3>
              <p className="text-sc-fg-muted text-sm">
                This card has a pulsing glow effect for emphasis
              </p>
            </Card>
          </div>
        </section>

        {/* States Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-sc-fg-primary">States & Feedback</h2>

          {showSuccess ? (
            <SuccessState
              title="Mission Accomplished!"
              message="Your changes have been saved successfully"
            />
          ) : (
            <Card>
              <div className="text-center py-8">
                <Button onClick={handleSuccessDemo} spark>
                  Show Success Celebration
                </Button>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <EmptyState
                variant="search"
                title="No results found"
                description="Try adjusting your search terms or filters"
              />
            </Card>
            <Card>
              <EmptyState
                variant="data"
                title="No data yet"
                description="Start by adding your first entity to the graph"
                action={
                  <Button variant="primary" icon="➕">
                    Add Entity
                  </Button>
                }
              />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <ErrorState
                variant="error"
                message="Failed to load the knowledge graph. Please try again."
                action={
                  <Button variant="secondary" size="sm">
                    Retry
                  </Button>
                }
              />
            </Card>
            <Card>
              <ErrorState
                variant="offline"
                message="You're currently offline. Check your connection."
              />
            </Card>
          </div>

          <div className="space-y-4">
            <NotificationCard
              type="success"
              title="Entity Created"
              message="Your new pattern has been added to the knowledge graph"
              onDismiss={() => console.log('Dismissed')}
            />
            <NotificationCard
              type="info"
              title="Quick Tip"
              message="Use Cmd+K to quickly search across all entities"
              onDismiss={() => console.log('Dismissed')}
            />
            <NotificationCard
              type="warning"
              title="Storage Warning"
              message="You're approaching your storage limit. Consider archiving old data."
              action={
                <Button size="sm" variant="secondary">
                  Manage Storage
                </Button>
              }
            />
          </div>
        </section>

        {/* Animation Utilities */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-sc-fg-primary">Animation Utilities</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <div className="text-4xl mb-2 animate-float">🎈</div>
              <p className="text-sm text-sc-fg-muted">Float Animation</p>
            </Card>
            <Card>
              <div className="text-4xl mb-2 animate-wiggle">🎉</div>
              <p className="text-sm text-sc-fg-muted">Wiggle Animation</p>
            </Card>
            <Card>
              <div className="text-4xl mb-2 animate-bounce-in">✨</div>
              <p className="text-sm text-sc-fg-muted">Bounce In</p>
            </Card>
          </div>
          <Card className="hover-spark cursor-pointer">
            <p className="text-center text-sc-fg-muted">
              Hover over this card to see the spark effect
            </p>
          </Card>
          <Card className="electric-scan">
            <p className="text-center text-sc-fg-muted">
              Electric scan line animation
            </p>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center text-sc-fg-subtle text-sm pb-8">
          <p>Built with SilkCircuit design language - Electric meets elegant</p>
        </footer>
      </div>
    </div>
  );
}
