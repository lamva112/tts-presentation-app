// File: src/components/ControlPanel.jsx
// Logic hiện tại đã đảm bảo các nút chức năng gọi đúng API cho slide hiện hành

import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Button, Group, Text, Loader, Alert, Collapse, Box, Code, Tooltip, Modal, FileInput, Stack, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconPlayerPlayFilled, IconPlayerStopFilled, IconLoader, IconAlertCircle,
    IconChevronLeft, IconChevronRight, IconScript, IconEye, IconEyeOff, IconVolume,
    IconRobot, IconMessageCircleCode, IconUpload, IconFileText, IconFileDescription, IconPresentation
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
    const [_isPlaying, setIsPlaying] = useState(false);
    const [playbackError, setPlaybackError] = useState('');
    const [generatedScriptText, setGeneratedScriptText] = useState('');
    const [scriptSource, setScriptSource] = useState('');
    const [isScriptVisible, setIsScriptVisible] = useState(false);
    const [scriptError, setScriptError] = useState('');

    // Upload Materials states
    const [uploadModalOpened, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState(null);

    const isBusy = isLoading || isOriginalLoading || isGeneratedLoading || isScriptLoading;

    const resetControlState = useCallback(() => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }
        if (audioSourceUrl) {
            URL.revokeObjectURL(audioSourceUrl);
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
    }, [audioSourceUrl]);

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
                } catch { /* Ignore */ }
            } else if (error.response?.data?.detail) {
                errorDetail = error.response.data.detail;
            }
            setPlaybackError(`Error: ${errorDetail}`);
            setAudioSourceUrl(null);
        } finally {
            setLoadingState(false);
        }
    }, [presentationId, currentSlideNumber, audioSourceUrl]);

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

    // Upload Materials functions
    const showNotification = (title, message, color = 'blue') => {
        setNotification({ title, message, color });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleDocumentUpload = async () => {
        if (!uploadFile) return;
        if (!presentationId) {
            showNotification('Error', 'No presentation ID found. Please upload a presentation first.', 'red');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadFile);

            // Step 1: Upload materials
            console.log('Step 1: Uploading materials...');
            const uploadResponse = await api.uploadPresentationMaterials(formData, presentationId);
            console.log('Materials uploaded successfully:', uploadResponse);

            // Step 2: Generate bot script automatically
            console.log('Step 2: Generating bot script...');
            showNotification('Processing...', 'Materials uploaded. Generating AI script...', 'blue');

            const generateResponse = await api.generateBotScript(presentationId);
            console.log('Bot script generated successfully:', generateResponse);

            showNotification('Complete!', `Materials uploaded and AI script generated successfully: "${uploadFile.name}"`, 'green');

            setUploadFile(null);
            closeUploadModal();

        } catch (error) {
            console.error('Upload/Generate failed:', error);

            let errorMessage = 'Process failed. Please try again.';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showNotification('Process Failed', errorMessage, 'red');
        } finally {
            setUploading(false);
        }
    };

    const resetUploadForm = () => {
        setUploadFile(null);
    };

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

            {/* --- Phần nút AI Script Controls --- */}
            <Group mb="md">
                <Tooltip label="Play audio synthesized from the AI-generated script">
                    <Button
                        onClick={handlePlayGenerated}
                        disabled={isBusy}
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                        loading={isGeneratedLoading}
                        loaderProps={{ type: 'dots' }}
                        leftSection={isGeneratedLoading ? null : <IconRobot size={16} />}
                        rightSection={<Badge size="xs" variant="light" color="teal">Auto AI</Badge>}
                    >
                        Play AI Script
                    </Button>
                </Tooltip>
                <Button onClick={handleToggleScript} disabled={isBusy} variant="light" loading={isScriptLoading} loaderProps={{ type: 'dots' }} leftSection={isScriptLoading ? null : (isScriptVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />)} > {isScriptVisible ? 'Hide AI Script' : 'Show AI Script'} </Button>
            </Group>

            {/* --- Thẻ Audio và hiển thị lỗi Audio --- */}
            {audioSourceUrl && (<audio ref={audioPlayerRef} controls style={{ width: '100%', marginTop: '10px', display: 'block' }} onEnded={handleAudioEnded} onPause={handleAudioPause} onPlay={handleAudioPlay} onError={() => { setPlaybackError("Error playing audio file."); setIsPlaying(false); }} />)}
            {playbackError && (<Alert icon={<IconAlertCircle size="1rem" />} title="Audio Error" color="red" radius="xs" mt="xs" withCloseButton onClose={() => setPlaybackError('')}> {playbackError} </Alert>)}

            {/* --- Phần nút Upload Materials và Play User Script --- */}
            <Group mt="md" mb="md">
                <Tooltip label="Upload materials and automatically generate AI script">
                    <Button
                        leftSection={<IconPresentation size={16} />}
                        rightSection={<Badge size="xs" variant="light" color="gray">Optional</Badge>}
                        variant="gradient"
                        gradient={{ from: 'purple', to: 'pink', deg: 45 }}
                        onClick={openUploadModal}
                        disabled={isBusy}
                        style={{ fontWeight: 600 }}
                    >
                        Upload Presentation Material
                    </Button>
                </Tooltip>
                <Tooltip label="Play audio synthesized from the user script">
                    <Button onClick={handlePlayOriginal} disabled={isBusy} variant="outline" loading={isOriginalLoading} loaderProps={{ type: 'dots' }} leftSection={isOriginalLoading ? null : <IconVolume size={16} />} > Play User Script </Button>
                </Tooltip>
            </Group>

            {/* --- Phần hiển thị Script AI Content --- */}
            <Box mt="md">
                {scriptError && !isScriptLoading && (<Alert icon={<IconAlertCircle size={16} />} title="Script Error" color="yellow" radius="xs" mt="xs" withCloseButton onClose={() => setScriptError('')}> {scriptError} </Alert>)}
                <Collapse in={isScriptVisible} mt="xs">
                    <Box p="sm" style={{ border: '1px dashed var(--mantine-color-gray-7)', borderRadius: 'var(--mantine-radius-sm)', background: 'var(--mantine-color-dark-7)' }}>
                        {isScriptLoading ? (<Group justify='center'><Loader size="sm" /></Group>) : (
                            generatedScriptText ? (
                                <>
                                    <Text size="xs" c="dimmed" mb={5}>Script Source: {scriptSource}</Text>
                                    <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '250px', overflowY: 'auto' }}> {generatedScriptText} </Code>
                                </>
                            ) : (!scriptError && <Text size="sm" c="dimmed">No script available or generated yet.</Text>)
                        )}
                    </Box>
                </Collapse>
            </Box>

            {/* Notification Banner */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '70px',
                    right: '20px',
                    zIndex: 1000,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: notification.color === 'green' ? '#4caf50' : notification.color === 'red' ? '#f44336' : '#2196f3',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxWidth: '300px',
                    wordWrap: 'break-word'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{notification.title}</div>
                    <div style={{ fontSize: '14px' }}>{notification.message}</div>
                </div>
            )}

            {/* Upload Materials Modal */}
            <Modal
                opened={uploadModalOpened}
                onClose={closeUploadModal}
                title={
                    <Group gap="sm">
                        <IconPresentation size={20} color="#3b82f6" />
                        <Text fw={600}>Upload Materials & Generate AI Script</Text>
                    </Group>
                }
                size="md"
                onCloseComplete={resetUploadForm}
                styles={{
                    title: {
                        fontSize: '18px',
                        fontWeight: 600
                    }
                }}
            >
                <Stack gap="lg">
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <IconFileDescription size={48} color="#6b7280" />
                        <Text size="sm" c="dimmed" mt="xs">
                            Upload supporting materials and automatically generate AI script
                        </Text>
                    </div>

                    <FileInput
                        label="Select Materials"
                        placeholder="Choose Word, PDF, or other supporting files"
                        accept=".doc,.docx,.pdf,.txt,.md,.rtf"
                        value={uploadFile}
                        onChange={setUploadFile}
                        leftSection={<IconFileText size={16} />}
                        required
                        disabled={uploading}
                        styles={{
                            input: {
                                borderColor: '#e5e7eb',
                                '&:focus': {
                                    borderColor: '#3b82f6'
                                }
                            }
                        }}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={closeUploadModal} radius="md" disabled={uploading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDocumentUpload}
                            loading={uploading}
                            disabled={!uploadFile || uploading}
                            leftSection={<IconUpload size={16} />}
                            variant="gradient"
                            gradient={{ from: 'purple', to: 'pink', deg: 45 }}
                            radius="md"
                            style={{ fontWeight: 600 }}
                        >
                            {uploading ? 'Processing...' : 'Upload Material'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}

export default ControlPanel;