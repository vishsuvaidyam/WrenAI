import { ComponentRef, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { Button, Typography } from 'antd';
import { Logo } from '@/components/Logo';
import { Path } from '@/utils/enum';
import SiderLayout from '@/components/layouts/SiderLayout';
import Prompt from '@/components/pages/home/prompt';
import DemoPrompt from '@/components/pages/home/prompt/DemoPrompt';
import useHomeSidebar from '@/hooks/useHomeSidebar';
import useUserId from '../../hooks/useUserId';
import useAskPrompt from '@/hooks/useAskPrompt';
import useRecommendedQuestionsInstruction from '@/hooks/useRecommendedQuestionsInstruction';
import RecommendedQuestionsPrompt from '@/components/pages/home/prompt/RecommendedQuestionsPrompt';
import {
  useSuggestedQuestionsQuery,
  useCreateThreadMutation,
  useThreadLazyQuery,
} from '@/apollo/client/graphql/home.generated';
import { useGetSettingsQuery } from '@/apollo/client/graphql/settings.generated';
import { CreateThreadInput } from '@/apollo/client/graphql/__types__';

const { Text } = Typography;

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="d-flex align-center justify-center flex-column"
      style={{ height: '100%' }}
    >
      <Logo size={48} color="var(--gray-8)" />
      <div className="text-md text-medium gray-8 mt-3">
        Know more about your data
      </div>
      {children}
    </div>
  );
};

const SampleQuestionsInstruction = (props: {
  sampleQuestions: any[];
  onSelect: (question: { question: string }) => void;
}) => {
  const { sampleQuestions, onSelect } = props;

  return (
    <Wrapper>
      <DemoPrompt demo={sampleQuestions} onSelect={onSelect} />
    </Wrapper>
  );
};

function RecommendedQuestionsInstruction(props: {
  onSelect: (payload: CreateThreadInput) => void;
  loading: boolean;
}) {
  const { onSelect, loading } = props;

  const {
    buttonProps,
    generating,
    recommendedQuestions,
    showRetry,
    showRecommendedQuestionsPromptMode,
  } = useRecommendedQuestionsInstruction();

  return showRecommendedQuestionsPromptMode ? (
    <div
      className="d-flex align-center flex-column pt-10"
      style={{ margin: 'auto' }}
    >
      <RecommendedQuestionsPrompt
        recommendedQuestions={recommendedQuestions}
        onSelect={onSelect}
        loading={loading}
      />
      <div className="py-12" />
    </div>
  ) : (
    <Wrapper>
      <Button className="mt-6" {...buttonProps} />
      {generating && (
        <Text className="mt-3 text-sm gray-6">
          Thinking of good questions for you... (about 1 minute)
        </Text>
      )}
      {!generating && showRetry && (
        <Text className="mt-3 text-sm gray-6 text-center">
          We couldn't think of questions right now.
          <br />
          Let's try again later.
        </Text>
      )}
    </Wrapper>
  );
}

export default function Home() {
  const $prompt = useRef<ComponentRef<typeof Prompt>>(null);
  const router = useRouter();
  const { userId, isUserIdReady } = useUserId();
  const homeSidebar = useHomeSidebar(userId);
  const askPrompt = useAskPrompt();

  const { data: suggestedQuestionsData } = useSuggestedQuestionsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [createThread, { loading: threadCreating }] = useCreateThreadMutation({
    onError: (error) => console.error(error),
    onCompleted: () => homeSidebar.refetch(),
  });
  const [preloadThread] = useThreadLazyQuery({
    fetchPolicy: 'cache-and-network',
  });

  const { data: settingsResult } = useGetSettingsQuery();
  const settings = settingsResult?.settings;
  const isSampleDataset = useMemo(
    () => Boolean(settings?.dataSource?.sampleDataset),
    [settings],
  );

  const sampleQuestions = useMemo(
    () => suggestedQuestionsData?.suggestedQuestions.questions || [],
    [suggestedQuestionsData],
  );

  const onSelectQuestion = async ({ question }) => {
    $prompt.current.submit(question);
  };

  const onCreateResponse = async (payload: CreateThreadInput) => {
    try {
      if (!isUserIdReady || !userId) {
        console.warn(
          'UserId not ready. Please wait for parent to send user info.',
        );
        return;
      }
      askPrompt.onStopPolling();
      const response = await createThread({ variables: { data: payload } });
      const threadId = response.data.createThread.id;

      // Save thread_id to Frappe
      const apiUrl = 'http://wren.localhost:8000';
      await fetch(
        `${apiUrl}/api/method/frappe_theme.controllers.wren.save_thread_id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `thread_id=${encodeURIComponent(threadId)}&user_id=${encodeURIComponent(userId)}`,
        },
      );

      await preloadThread({ variables: { threadId } });
      router.push(Path.Home + `/${threadId}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SiderLayout loading={false} sidebar={homeSidebar}>
      {isSampleDataset && (
        <SampleQuestionsInstruction
          sampleQuestions={sampleQuestions}
          onSelect={onSelectQuestion}
        />
      )}

      {!isSampleDataset && (
        <RecommendedQuestionsInstruction
          onSelect={onCreateResponse}
          loading={threadCreating}
        />
      )}
      <Prompt
        ref={$prompt}
        {...askPrompt}
        onCreateResponse={onCreateResponse}
      />
    </SiderLayout>
  );
}
