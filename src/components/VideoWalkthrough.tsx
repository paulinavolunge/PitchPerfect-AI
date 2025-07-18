import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause,
  Volume2, 
  VolumeX,
  Maximize,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VideoWalkthrough: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Demo video - actual video file
  const videoSrc = "/videos/final_combined_video.mp4";

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const features = [
    { title: "Voice Practice", description: "See how AI analyzes vocal tone and pacing" },
    { title: "Real-time Feedback", description: "Watch instant scoring and suggestions appear" },
    { title: "Progress Tracking", description: "View detailed analytics and improvement charts" },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 to-vibrant-blue-50" aria-labelledby="video-walkthrough-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary-100 text-primary-700 border-primary-200" aria-label="Video demonstration">
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Video Walkthrough
          </Badge>
          <h2 id="video-walkthrough-heading" className="text-3xl md:text-4xl font-bold text-deep-navy mb-4">
            See PitchPerfect AI in Action
          </h2>
          <p className="text-deep-navy/70 max-w-2xl mx-auto text-lg">
            Watch a complete demonstration of our AI-powered sales training platform in under 3 minutes.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-2xl border-2 border-primary-100">
                <div className="relative bg-black aspect-video">
                  {/* Actual video element */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    aria-label="PitchPerfect AI product demonstration video"
                  >
                    <source src={videoSrc} type="video/mp4" />
                    <track
                      kind="captions"
                      src="/demo-captions.vtt"
                      srcLang="en"
                      label="English captions"
                    />
                    Your browser does not support the video element.
                  </video>
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center space-x-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePlayPause}
                        className="text-white hover:bg-white/20"
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleMuteToggle}
                        className="text-white hover:bg-white/20"
                        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      
                      {/* Progress Bar */}
                      <div className="flex-1">
                        <div 
                          className="h-2 bg-white/30 rounded-full cursor-pointer"
                          onClick={handleSeek}
                          role="slider"
                          aria-label="Video progress"
                          aria-valuemin={0}
                          aria-valuemax={duration}
                          aria-valuenow={currentTime}
                          tabIndex={0}
                        >
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      
                      <span className="text-white text-sm font-medium">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRestart}
                        className="text-white hover:bg-white/20"
                        aria-label="Restart video"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleFullScreen}
                        className="text-white hover:bg-white/20"
                        aria-label="Enter fullscreen"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-deep-navy mb-4">
                What You'll See:
              </h3>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-primary-100 shadow-sm"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-deep-navy mb-1">{feature.title}</h4>
                    <p className="text-deep-navy/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 space-y-3">
                <Button 
                  onClick={() => navigate('/demo')}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  Try Interactive Demo
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  variant="outline"
                  className="w-full border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoWalkthrough;