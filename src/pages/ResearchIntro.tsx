import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, Target, Shield, BookOpen, ArrowRight } from 'lucide-react';

const ResearchIntro = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <GraduationCap className="w-12 h-12 text-primary" />,
      title: "Witamy w badaniu naukowym",
      subtitle: "Praca magisterska - Informatyka",
      content: "Dzień dobry! Zapraszamy do udziału w badaniu będącym częścią pracy magisterskiej na kierunku Informatyka. Celem tego badania jest analiza skuteczności różnych strategii retencji klientów w procesach anulowania subskrypcji."
    },
    {
      icon: <Target className="w-12 h-12 text-primary" />,
      title: "Cel badania",
      subtitle: "Optymalizacja procesów retencji",
      content: "Badamy, jak różne komponenty interfejsu użytkownika wpływają na decyzje klientów podczas procesu anulowania polisy. Analizujemy skuteczność oferowanych zachęt, metod komunikacji i strategii zatrzymania klientów."
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Twoja rola",
      subtitle: "Symulacja procesu anulowania",
      content: "Będziesz przechodzić przez symulowany proces anulowania polisy ubezpieczeniowej. Proces jest w pełni bezpieczny i nie ma żadnych rzeczywistych konsekwencji finansowych. Wszystkie dane są zbierane anonimowo wyłącznie w celach naukowych."
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: "Prywatność i bezpieczeństwo",
      subtitle: "Ochrona danych uczestników",
      content: "Wszystkie zebrane dane są anonimowe i używane wyłącznie do celów naukowych. Badanie jest prowadzone zgodnie z etyką badań naukowych i regulacjami RODO. Możesz wycofać się z badania w każdym momencie."
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
              <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl mx-auto">
                {currentSlideData.content}
              </p>
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
            <span>Badanie naukowe prowadzone na Uniwersytecie</span>
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