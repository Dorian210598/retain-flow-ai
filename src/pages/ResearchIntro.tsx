import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GraduationCap, Users, Target, Shield, BookOpen, ArrowRight, HelpCircle } from 'lucide-react';

const ResearchIntro = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <GraduationCap className="w-12 h-12 text-primary" />,
      title: "Witamy w badaniu naukowym",
      subtitle: "Praca magisterska - Informatyka",
      content: "Dzień dobry! Zapraszamy do udziału w badaniu będącym częścią pracy magisterskiej na kierunku Informatyka. Celem tego badania jest analiza skuteczności różnych strategii retencji klientów w procesach anulowania subskrypcji.",
      tooltips: [
        { text: "retencji klientów", tooltip: "Retencja klientów to proces zatrzymywania istniejących klientów i zapobiegania ich odejściu do konkurencji. Firmy używają różnych strategii, aby przekonać klientów do pozostania." }
      ]
    },
    {
      icon: <Target className="w-12 h-12 text-primary" />,
      title: "Cel badania",
      subtitle: "Optymalizacja procesów retencji",
      content: "Badamy, jak różne komponenty interfejsu użytkownika wpływają na decyzje klientów podczas procesu anulowania polisy. Analizujemy skuteczność oferowanych zachęt, metod komunikacji i strategii zatrzymania klientów.",
      tooltips: [
        { text: "komponenty interfejsu", tooltip: "Elementy strony internetowej takie jak formularze, przyciski, oferty specjalne czy harmonogramy rozmów, które mają wpłynąć na decyzję użytkownika." },
        { text: "strategii zatrzymania", tooltip: "Różne metody używane przez firmy do przekonania klientów, aby nie anulowali usługi - mogą to być rabaty, przerwy w płatnościach, czy rozmowy z obsługą klienta." }
      ]
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Twoja rola",
      subtitle: "Symulacja procesu anulowania",
      content: "Będziesz przechodzić przez symulowany proces anulowania polisy ubezpieczeniowej. Proces jest w pełni bezpieczny i nie ma żadnych rzeczywistych konsekwencji finansowych. Wszystkie dane są zbierane anonimowo wyłącznie w celach naukowych.",
      tooltips: [
        { text: "proces anulowania", tooltip: "Seria kroków, przez które przechodzi klient chcąc zrezygnować z usługi. Firmy projektują te procesy tak, aby maksymalnie zwiększyć szanse zatrzymania klienta." },
        { text: "polisy ubezpieczeniowej", tooltip: "W tym badaniu symulujemy anulowanie umowy ubezpieczeniowej, ale zasady dotyczą każdej usługi subskrypcyjnej (Netflix, Spotify itp.)." }
      ]
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: "Prywatność i bezpieczeństwo",
      subtitle: "Ochrona danych uczestników",
      content: "Wszystkie zebrane dane są anonimowe i używane wyłącznie do celów naukowych. Badanie jest prowadzone zgodnie z etyką badań naukowych i regulacjami RODO. Możesz wycofać się z badania w każdym momencie.",
      tooltips: [
        { text: "dane są anonimowe", tooltip: "Nie zbieramy żadnych danych osobowych. Śledzimy tylko to, które opcje wybierasz w procesie anulowania - bez powiązania z Twoją tożsamością." },
        { text: "regulacjami RODO", tooltip: "Rozporządzenie o Ochronie Danych Osobowych - europejskie prawo chroniące prywatność obywateli UE." }
      ]
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/auth');
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];

  const renderContentWithTooltips = (content: string, tooltips?: Array<{text: string, tooltip: string}>) => {
    if (!tooltips || tooltips.length === 0) {
      return <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">{content}</p>;
    }

    let processedContent = content;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    tooltips.forEach((tooltipData, index) => {
      const tooltipIndex = processedContent.indexOf(tooltipData.text, lastIndex);
      if (tooltipIndex !== -1) {
        // Add text before tooltip
        if (tooltipIndex > lastIndex) {
          parts.push(processedContent.slice(lastIndex, tooltipIndex));
        }
        
        // Add tooltip
        parts.push(
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline decoration-dotted decoration-primary cursor-help text-primary">
                  {tooltipData.text}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{tooltipData.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
        
        lastIndex = tooltipIndex + tooltipData.text.length;
      }
    });

    // Add remaining text
    if (lastIndex < processedContent.length) {
      parts.push(processedContent.slice(lastIndex));
    }

    return (
      <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
        {parts}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              {currentSlideData.icon}
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              {currentSlideData.title}
            </CardTitle>
            <CardDescription className="text-lg text-primary font-medium">
              {currentSlideData.subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="text-center">
              {renderContentWithTooltips(currentSlideData.content, currentSlideData.tooltips)}
            </div>

            {/* Progress indicators */}
            <div className="flex justify-center space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="px-6"
              >
                Wstecz
              </Button>

              <div className="text-sm text-muted-foreground">
                {currentSlide + 1} z {slides.length}
              </div>

              <Button
                onClick={nextSlide}
                className="px-6 gap-2"
              >
                {currentSlide === slides.length - 1 ? (
                  <>
                    Rozpocznij badanie
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  'Dalej'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>Badanie naukowe prowadzone na Uniwersytecie WSB Merito w Gdańsku</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Czas trwania: około 5-10 minut
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResearchIntro;