// File: src/components/ControlPanel.jsx
// Logic hiện tại đã đảm bảo các nút chức năng gọi đúng API cho slide hiện hành

import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Button, Group, Text, Loader, Alert, Collapse, Box, Code, Tooltip } from '@mantine/core';
import {
    IconPlayerPlayFilled, IconPlayerStopFilled, IconLoader, IconAlertCircle,
    IconChevronLeft, IconChevronRight, IconScript, IconEye, IconEyeOff, IconVolume,
    IconRobot, IconMessageCircleCode
} from '@tabler/icons-react';

function ControlPanel({
    presentationId,
    currentSlideNumber, // <<< Nhận slide number hiện tại từ cha
    totalSlides,
    onSlideChange,    // <<< Hàm callback để báo cha thay đổi slide number
    isLoading         // <<< State loading của cha
}) {
    const [isOriginalLoading, setIsOriginalLoading] = useState(false);
    const [isGeneratedLoading, setIsGeneratedLoading] = useState(false);
    const [isScriptLoading, setIsScriptLoading] = useState(false);
    const audioPlayerRef = useRef(null);
    const [audioSourceUrl, setAudioSourceUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackError, setPlaybackError] = useState('');
    const [generatedScriptText, setGeneratedScriptText] = useState('');
    const [scriptSource, setScriptSource] = useState('');
    const [isScriptVisible, setIsScriptVisible] = useState(false);
    const [scriptError, setScriptError] = useState('');

    const isBusy = isLoading || isOriginalLoading || isGeneratedLoading || isScriptLoading;

    const resetControlState = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }
        setAudioSourceUrl(null);
        setIsPlaying(false);
        setPlaybackError('');
        setIsScriptVisible(false);
        setGeneratedScriptText('');
        setScriptSource('');
        setScriptError('');
        setIsOriginalLoading(false);
        setIsGeneratedLoading(false);
        setIsScriptLoading(false);
    }, []); // Thêm audioSourceUrl vào dependency nếu cần revoke ngay lập tức

    const playAudio = useCallback(async (fetchAudioFunction, setLoadingState) => {
        setPlaybackError('');
        setScriptError('');
        if (audioPlayerRef.current && audioSourceUrl) {
             audioPlayerRef.current.pause();
        }
        setAudioSourceUrl(null);
        setIsPlaying(false);
        setLoadingState(true);
        try {
            // Sử dụng currentSlideNumber hiện tại được truyền qua prop
            const audioBlob = await fetchAudioFunction(presentationId, currentSlideNumber);
            if (audioBlob instanceof Blob && audioBlob.size > 0) {
                const objectUrl = URL.createObjectURL(audioBlob);
                setAudioSourceUrl(objectUrl);
            } else {
                 throw new Error('Received empty or invalid audio data.');
            }
        } catch (error) {
            console.error('Failed to fetch or play audio:', error);
            let errorDetail = error.message || 'Failed to process audio request.';
            if (error.response?.data instanceof Blob && error.response?.headers?.['content-type'] === 'application/json') {
               try {
                   const errorJson = JSON.parse(await error.response.data.text());
                   errorDetail = errorJson.detail || 'Unknown API error';
               } catch (parseError) { /* Ignore */ }
           } else if (error.response?.data?.detail) {
                errorDetail = error.response.data.detail;
           }
            setPlaybackError(`Error: ${errorDetail}`);
            setAudioSourceUrl(null);
        } finally {
            setLoadingState(false);
        }
    }, [presentationId, currentSlideNumber]); // Thêm currentSlideNumber vào dependencies

    useEffect(() => {
        if (audioSourceUrl && audioPlayerRef.current) {
            audioPlayerRef.current.src = audioSourceUrl;
            audioPlayerRef.current.load();
            audioPlayerRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(playError => {
                    console.error("Audio play failed:", playError);
                    setPlaybackError(`Browser may have blocked autoplay: ${playError.message}. Try clicking play.`);
                    setIsPlaying(false);
                });
        } else {
            setIsPlaying(false);
        }
        const currentUrl = audioSourceUrl;
        return () => { if (currentUrl) URL.revokeObjectURL(currentUrl); };
    }, [audioSourceUrl]);

    const handlePlayOriginal = () => playAudio(api.getOriginalSpeech, setIsOriginalLoading);
    const handlePlayGenerated = () => playAudio(api.getGeneratedSpeech, setIsGeneratedLoading);

    const handleToggleScript = async () => {
        if (isScriptVisible) {
            setIsScriptVisible(false);
        } else {
            setIsScriptLoading(true);
            setPlaybackError('');
            setScriptError('');
            setGeneratedScriptText('');
            setScriptSource('');
            try {
                // Sử dụng currentSlideNumber hiện tại được truyền qua prop
                const scriptData = await api.getGeneratedScript(presentationId, currentSlideNumber);
                if (scriptData && typeof scriptData.script === 'string') {
                    if (scriptData.script.includes("[Script content blocked")) {
                         setGeneratedScriptText(scriptData.script);
                         setScriptError("Script content was blocked by safety filters.");
                    } else {
                         setGeneratedScriptText(scriptData.script);
                    }
                     setScriptSource(scriptData.source || 'unknown');
                } else {
                     throw new Error("Received invalid script data format.");
                }
                setIsScriptVisible(true);
            } catch (error) {
                console.error('Failed to fetch generated script:', error);
                const errorDetail = error.response?.data?.detail || error.message || 'Failed to load generated script.';
                setScriptError(`Error loading script: ${errorDetail}`);
                setIsScriptVisible(false);
            } finally {
                setIsScriptLoading(false);
            }
        }
    };

    // Hàm xử lý nút Previous
    const handlePrevious = () => {
        if (currentSlideNumber > 1) {
            onSlideChange(currentSlideNumber - 1); // Gọi callback của cha để giảm slide number
            resetControlState(); // Reset trạng thái audio/script của slide cũ
        }
    };

    // Hàm xử lý nút Next
    const handleNext = () => {
        if (totalSlides <= 0 || currentSlideNumber < totalSlides) {
            onSlideChange(currentSlideNumber + 1); // Gọi callback của cha để tăng slide number
            resetControlState(); // Reset trạng thái audio/script của slide cũ
        }
    };

    const handleAudioEnded = () => setIsPlaying(false);
    const handleAudioPause = () => setIsPlaying(false);
    const handleAudioPlay = () => setIsPlaying(true);

    return (
        <Box mt="xl" p="md" style={{ border: '1px solid var(--mantine-color-gray-8)', borderRadius: 'var(--mantine-radius-md)' }}>
             {/* --- Phần hiển thị tiêu đề và nút điều hướng --- */}
            <Group justify="space-between" mb="md">
                <Text fw={500}>Controls (Slide {currentSlideNumber}{totalSlides > 0 ? ` / ${totalSlides}` : ''})</Text>
                <Group>
                    <Button onClick={handlePrevious} disabled={currentSlideNumber <= 1 || isBusy} variant="default" leftSection={<IconChevronLeft size={16} />}> Previous </Button>
                    <Button onClick={handleNext} disabled={(totalSlides > 0 && currentSlideNumber >= totalSlides) || isBusy} variant="default" rightSection={<IconChevronRight size={16} />}> Next </Button>
                </Group>
            </Group>

            {/* --- Phần nút Play Audio --- */}
            <Group mb="md">
                <Tooltip label="Play audio synthesized from the original slide text">
                    <Button onClick={handlePlayOriginal} disabled={isBusy} variant="outline" loading={isOriginalLoading} loaderProps={{ type: 'dots' }} leftSection={isOriginalLoading ? null : <IconVolume size={16} />} > Play Original Text </Button>
                </Tooltip>
                <Tooltip label="Play audio synthesized from the AI-generated script">
                     <Button onClick={handlePlayGenerated} disabled={isBusy} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} loading={isGeneratedLoading} loaderProps={{ type: 'dots' }} leftSection={isGeneratedLoading ? null : <IconRobot size={16} />} > Play AI Script </Button>
                </Tooltip>
            </Group>

            {/* --- Thẻ Audio và hiển thị lỗi Audio --- */}
            {audioSourceUrl && ( <audio ref={audioPlayerRef} controls style={{ width: '100%', marginTop: '10px', display: 'block' }} onEnded={handleAudioEnded} onPause={handleAudioPause} onPlay={handleAudioPlay} onError={(e) => { setPlaybackError("Error playing audio file."); setIsPlaying(false); }} /> )}
            {playbackError && ( <Alert icon={<IconAlertCircle size="1rem" />} title="Audio Error" color="red" radius="xs" mt="xs" withCloseButton onClose={() => setPlaybackError('')}> {playbackError} </Alert> )}

            {/* --- Phần hiển thị Script AI --- */}
            <Box mt="md">
                 <Button onClick={handleToggleScript} disabled={isBusy} variant="light" loading={isScriptLoading} loaderProps={{type: 'dots'}} leftSection={isScriptLoading ? null : (isScriptVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />)} > {isScriptVisible ? 'Hide AI Script' : 'Show AI Script'} </Button>
                 {scriptError && !isScriptLoading && ( <Alert icon={<IconAlertCircle size={16} />} title="Script Error" color="yellow" radius="xs" mt="xs" withCloseButton onClose={() => setScriptError('')}> {scriptError} </Alert> )}
                 <Collapse in={isScriptVisible} mt="xs">
                     <Box p="sm" style={{ border: '1px dashed var(--mantine-color-gray-7)', borderRadius: 'var(--mantine-radius-sm)', background: 'var(--mantine-color-dark-7)'}}>
                         {isScriptLoading ? ( <Group justify='center'><Loader size="sm" /></Group> ) : (
                             generatedScriptText ? (
                                 <>
                                    <Text size="xs" c="dimmed" mb={5}>Script Source: {scriptSource}</Text>
                                    <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '250px', overflowY: 'auto'}}> {generatedScriptText} </Code>
                                 </>
                             ) : ( !scriptError && <Text size="sm" c="dimmed">No script available or generated yet.</Text> )
                         )}
                     </Box>
                 </Collapse>
            </Box>
        </Box>
    );
}

export default ControlPanel;